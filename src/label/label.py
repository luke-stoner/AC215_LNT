#import necessary libraries 
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import pandas as pd
import os
from sklearn.model_selection import train_test_split
import torch
from torch.utils.data import DataLoader, TensorDataset
from torch.nn.functional import softmax
from torch.optim import AdamW
from google.cloud import storage 
import io
import tempfile
import wandb

# Declare global variables
GCP_DATA_BUCKET = 'data-lnt'
GCP_MODELS_BUCKET = 'models-lnt'
GCP_SOURCE_FILENAME = 'raw/unlabeled.csv'
GCP_HAND_LABEL_FILENAME = 'raw/hand_labeled.csv'
MODEL_SPECIFICATION = "siebert/sentiment-roberta-large-english"
OUTPUT_FILEPATH = 'processed/labeled.csv'
MODEL_DIR_FINETUNE = 'fine_tune_label'
GCP_KEY = os.environ.get('GCP_KEY')
WANDB_FILE = 'secrets/wandb.txt'

TEST_SIZE = 0.3
NUMBER_EPOCHS = 10
RANDOM_STATE = 215
ADAM_LEARNING_RATE = 1e-5
ADAM_BATCH_SIZE = 16
LABEL_BATCH_SIZE = 32
PATIENCE = 5

#create GCP Client
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = GCP_KEY
storage_client = storage.Client()
bucket = storage_client.bucket(GCP_DATA_BUCKET)
unlabeled_blob = bucket.blob(GCP_SOURCE_FILENAME)
labeled_blob = bucket.blob(GCP_HAND_LABEL_FILENAME)
wandb_blob = bucket.blob(WANDB_FILE)

#get unlabeled and hand labeled datasets
unlabeled_content = unlabeled_blob.download_as_text()
labeled_content = labeled_blob.download_as_text()

#set wandb key
wandb_content = wandb_blob.download_as_string()
WANDB_KEY = str(wandb_content)[2:-1]

# Check if a GPU is available
if torch.cuda.is_available():
    # Set the device to the first available GPU
    device = torch.device("cuda:0")
else:
    # If no GPU is available, use the CPU
    device = torch.device("cpu")

# Print the device being used
print(f"Using device: {device}")

# login to weights and biases
wandb.login(key=WANDB_KEY)

# start a new wandb run to track this script
wandb.init(
    # set the wandb project where this run will be logged
    project="lnt-bert",
    
    # track hyperparameters and run metadata
    config={
    "learning_rate": ADAM_LEARNING_RATE,
    "architecture": "BERT",
    "dataset": GCP_SOURCE_FILENAME,
    "epochs": NUMBER_EPOCHS,
    }
)


def get_model(model_name):
    """
    Input: model_name (name of desired BERT model)
    Output: tokenizer, model

    >>> get_model("cardiffnlp/twitter-xlm-roberta-base-sentiment")
    tokenizer(model_name), model(model_name)
    """
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSequenceClassification.from_pretrained(model_name).to(device)

    return tokenizer, model


def tokenize(dataframe):
    """
    Input: Pandas dataframe (assumes text column = 'text')
    Output: tokenized text

    >>> tokenize(df)
    tokenized_texts
    """
    text_samples = dataframe['text'].tolist()
    tokenized_texts = tokenizer(text_samples, padding=True, return_tensors='pt')

    return tokenized_texts


def get_datasets(df, labels, tokenizer, test_size=TEST_SIZE):
    """
    Returns training and validation datasets given a dataframe and tokenizer

    Input: panadas dataframe, labels column, tokenizer, test size
    Output: tokenized text

    >>> tokenize(df)
    tokenized_texts
    """
    # Define training and valid dataframes
    train_df, valid_df = train_test_split(df, test_size=test_size,
                                          random_state=RANDOM_STATE)

    # Tokenize the training data
    train_encodings = tokenizer(train_df['text'].tolist(), truncation=True,
                                padding=True, return_tensors='pt')
    train_labels = torch.tensor(train_df[labels].tolist())

    # Tokenize the validation data
    valid_encodings = tokenizer(valid_df['text'].tolist(), truncation=True,
                                padding=True, return_tensors='pt')
    valid_labels = torch.tensor(valid_df[labels].tolist())

    # Create DataLoader objects
    train_dataset = TensorDataset(train_encodings.input_ids,
                                  train_encodings.attention_mask, train_labels)
    valid_dataset = TensorDataset(valid_encodings.input_ids,
                                  valid_encodings.attention_mask, valid_labels)

    return train_dataset, valid_dataset


def train(model, train_dataset, valid_dataset, device, epochs=NUMBER_EPOCHS, patience=5):
    """
    Fine tunes the pretrained BERT model based on the provided labeled datasets

    Input: BERT model, training dataset, validation dataset, number of epochs, patience
    Output: None (Prints epoch progress)

    >>> train_bert(high_confidence_df, train_data, valid_data, epochs=4, patience=5)
    Epoch 2/4: Validation Loss: 12.3452, Validation Accuracy: 0.8362
    """
    
    # Initialize variables for early stopping
    best_loss = float('inf')
    no_improvement = 0
    
    # Train loop
    optimizer = AdamW(model.parameters(), lr=ADAM_LEARNING_RATE)
    train_loader = DataLoader(train_dataset, batch_size=ADAM_BATCH_SIZE, shuffle=True)
    
    for epoch in range(epochs):
        model.train()
        
        for batch in train_loader:
            input_ids, attention_mask, labels = batch
            input_ids, attention_mask, labels = input_ids.to(device), attention_mask.to(device), labels.to(device)

            outputs = model(input_ids, attention_mask=attention_mask, labels=labels)
            loss = outputs.loss
            loss.backward()
            optimizer.step()
            optimizer.zero_grad()

        # Validation loop
        valid_loader = DataLoader(valid_dataset, batch_size=ADAM_BATCH_SIZE)
        model.eval()
        with torch.no_grad():
            total_loss = 0.0
            correct = 0
            total = 0
            for batch in valid_loader:
                input_ids, attention_mask, labels = batch
                input_ids, attention_mask, labels = input_ids.to(device), attention_mask.to(device), labels.to(device)

                outputs = model(input_ids, attention_mask=attention_mask)
                logits = outputs.logits
                loss = torch.nn.functional.cross_entropy(logits, labels)
                total_loss += loss.item()

                _, predicted = torch.max(logits, 1)
                correct += (predicted == labels).sum().item()
                total += labels.size(0)

            accuracy = correct / total
            average_loss = total_loss / len(valid_loader)

            print(f'Epoch {epoch + 1}/{epochs}: Validation Loss: {average_loss:.4f}, Validation Accuracy: {accuracy:.4f}')

            # Check for early stopping
            if average_loss < best_loss:
                best_loss = average_loss
                no_improvement = 0
            else:
                no_improvement += 1

            if no_improvement >= patience:
                print(f'Early stopping after {epoch + 1} epochs without improvement.')
                break  # Stop training

    print("Training completed.")
                  

def label(tokenized_texts, model, device, dataframe, batch_size=64):
    """
    Uses the BERT model to evaluate the unlabeled dataset. Sentiment scores and labels
    are added 
    to the dataframe based on the label provided by the model.

    Input: tokenized_texts, model, device, dataframe, batch_size
    Output: None
    """  
    #get input IDs and attention mask from tokenized text
    input_ids = tokenized_texts['input_ids'].to(device)
    attention_mask = tokenized_texts['attention_mask'].to(device)
    
    #define dataset from input IDs and attention mask
    dataset = TensorDataset(input_ids, attention_mask)

    #define batch size and create DataLoader
    batch_size = batch_size
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=False)
    
    #set model to evaluation mode
    model.eval()

    #create empty list to store labels for entire dataset
    labels = []
    
    for batch_input_ids, batch_attention_mask in dataloader:
        with torch.no_grad():
            outputs = model(batch_input_ids, attention_mask=batch_attention_mask)
        
        #get output logits and convert to label confidence
        logits = outputs.logits
        
        #append batch labels to dataset label list
        batch_labels = torch.softmax(logits, dim=1)
        labels.append(batch_labels)
        
    #concatenate all labels
    labels = torch.cat(labels, dim=0)
    
    #move labels to CPU to append to dataframe
    labels = labels.cpu()
    
    #extract the raw scores for each sentiment class
    negative_scores = [score[0].item() for score in labels]
    positive_scores = [score[1].item() for score in labels]
    
    #define final sentiment label my max of sentiment scores
    sentiment = []
    for neg, pos in zip(negative_scores, positive_scores):
        sentiment.append([neg, pos].index(max([neg, pos])))

    #append the scores and predicted labels to the DataFrame
    dataframe['negative_score'] = negative_scores
    dataframe['positive_score'] = positive_scores
    dataframe['label'] = sentiment
                  
def save_dataset(df, outfilepath):
    """
    Saves the labeled dataframe to GCP data bucket
    
    Input: Pandas dataframe, GCP file path
    Output: None

    >>> save_dataset(dataframe, 'filepath'):
    returns None
    """
    #convert DataFrame to a CSV string
    csv_string = df.to_csv(index=False)

    #upload the CSV string to GCP
    blob = bucket.blob(outfilepath)
    blob.upload_from_string(csv_string)

def save_model(output_directory, models_bucket, model, tokenizer):
    """
    Saves the final fine tuned model and tokenizer to GCP models bucket

    Input: GCP output directory, model, tokenizer
    Output: None
    """
    # Create a temporary directory
    with tempfile.TemporaryDirectory() as temp_dir:
        
        # Serialize and save the model in the temporary directory
        model_path = os.path.join(temp_dir, 'model.pth')
        torch.save(model.state_dict(), model_path)

        # Save the tokenizer in the temporary directory
        tokenizer.save_pretrained(temp_dir)

        # Upload the serialized model to the GCS bucket
        bucket = storage_client.bucket(models_bucket)
        model_blob = bucket.blob(f'{output_directory}/model.pth')
        model_blob.upload_from_filename(model_path)

        # Upload the contents of the temporary directory to the GCS bucket
        for root, dirs, files in os.walk(temp_dir):
            for file in files:
                file_path = os.path.join(root, file)
                gcs_path = f'{output_directory}/{os.path.relpath(file_path, start=temp_dir)}'
                blob = bucket.blob(gcs_path)
                blob.upload_from_filename(file_path)

#import unlabeled dataset into dataframe
unlabeled_df = pd.read_csv(io.StringIO(unlabeled_content))
unlabeled_df = unlabeled_df.dropna()
                  
#import labeled dataset into dataframe
labeled_df = pd.read_csv(io.StringIO(labeled_content))
labeled_df = labeled_df.dropna()
                  
#define BERT model and tokenized text for labeled df
tokenizer, model = get_model(MODEL_SPECIFICATION)
tokenized_texts_labeled = tokenize(labeled_df)

#get training and validation datasets for unlabeled data
train_data, valid_data = get_datasets(labeled_df, 'label', tokenizer, TEST_SIZE)      

#fine-tune the BERT model based on labels
train(model, train_data, valid_data, device, epochs=NUMBER_EPOCHS, patience=PATIENCE)
                  
#define BERT model and tokenized text for labeled df
tokenized_texts_unlabeled = tokenize(unlabeled_df)

#label the unlabeled dataframe based on newly trained BERT model
label(tokenized_texts_unlabeled, model, device, unlabeled_df, batch_size=LABEL_BATCH_SIZE)
                  
#finish weights and biases
wandb.finish()
                  
#save final dataset
save_dataset(unlabeled_df, OUTPUT_FILEPATH)
                  
#save the fine-tuned model to GCP
save_model(MODEL_DIR_FINETUNE, GCP_MODELS_BUCKET, model, tokenizer)