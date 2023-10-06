#import necessary libraries
from transformers import AutoTokenizer, AutoModelForSequenceClassification, AdamW, BertForSequenceClassification, BertTokenizer
import pandas as pd
import os
from sklearn.model_selection import train_test_split
import torch
from torch.utils.data import DataLoader, TensorDataset
from google.cloud import storage 

##create GCP Client
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/Users/lu31635/Desktop/AC215/ac215.json"
source_filename = 'processed/initial_labels.csv'
storage_client = storage.Client()
data_bucket = storage_client.bucket('data-lnt')
models_bucket = storage_client.bucket('models-lnt')
in_file = data_bucket.blob(source_filename)

def get_model(model_directory):
    """
    Input: model_name (name of desired BERT model)
    Output: tokenizer, model

    >>> get_model("cardiffnlp/twitter-xlm-roberta-base-sentiment")
    tokenizer(model_name), model(model_name)
    """
    tokenizer = AutoTokenizer.from_pretrained(model_directory)
    model = AutoModelForSequenceClassification.from_pretrained(model_directory)

    return tokenizer, model

def get_high_confidence_df(df, threshold):
    """
    Filters an input dataframe to only include samples with label confidence above a defined threshold

    Input: dataframe with initial labels, desired confidence threshold
    Output: dataframe including only high confidence examples above specified threshold

    >>> get_high_confidence_df(df, 0.9)
    high_confidence_df
    """
    return df[(df['negative_score'] > threshold) |
    (df['neutral_score'] > threshold) |
    (df['positive_score'] > threshold)]

def tokenize(dataframe):
    """
    Returns tokenized text given a dataframe

    Input: Pandas dataframe (assumes text column = 'text')
    Output: tokenized text

    >>> tokenize(df)
    tokenized_texts
    """
    text_samples = dataframe['text'].tolist()
    tokenized_texts = tokenizer(text_samples, padding=True, truncation=True, return_tensors="pt")

    return tokenized_texts

def get_datasets(df, tokenizer, test_size=0.2):
    """
    Returns training and validation datasets given a dataframe and tokenizer

    Input: panadas dataframe, tokenizer, 
    Output: tokenized text

    >>> tokenize(df)
    tokenized_texts
    """
    # Define training and valid dataframes
    train_df, valid_df = train_test_split(df, test_size=test_size, random_state=215)

    # Tokenize the training data
    train_encodings = tokenizer(train_df['text'].tolist(), truncation=True, padding=True, return_tensors='pt')
    train_labels = torch.tensor(train_df['label'].tolist())

    # Tokenize the validation data
    valid_encodings = tokenizer(valid_df['text'].tolist(), truncation=True, padding=True, return_tensors='pt')
    valid_labels = torch.tensor(valid_df['label'].tolist())

    # Create DataLoader objects
    train_dataset = TensorDataset(train_encodings.input_ids, train_encodings.attention_mask, train_labels)
    valid_dataset = TensorDataset(valid_encodings.input_ids, valid_encodings.attention_mask, valid_labels)

    return train_dataset, valid_dataset

def train_bert(model, train_dataset, valid_dataset, epochs=3):
    """
    Fine tunes the pretrained BERT model based on the high confidence samples

    Input: BERT model, training dataset, validation dataset, number of epochs
    Output: None (Prints epoch progress)

    >>> train_bert(high_confidence_df, train_data, valid_data, epochs=4)
    Epoch 2/4: Validation Loss: 12.3452, Validation Accuracy: 0.8362
    """
    
    # Define device for compuation
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    # Train loop
    optimizer = AdamW(model.parameters(), lr=1e-5)
    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
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
    valid_loader = DataLoader(valid_dataset, batch_size=32)
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

def save_model(output_directory, model, tokenizer):
    """
    Saves the final fine tuned model and tokenizer to GCP models bucket

    Input: GCP output directory, model, tokenizer
    Output: None
    """

    output_dir = models_bucket.blob(output_directory)
    model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)


def label(model, df):
    """
    Uses the fine-tuned model to evaluate the full initial dataset. New labels are added to the dataframe
    based on the label provided by the fine-tuned model.

    Input: fine-tuned model, full dataframe
    Output: None
    """

    # Define tokenized text
    tokenized_texts = tokenize(df)
    
    # Evaluate the 
    model.eval()
    with torch.no_grad():
        input_ids = tokenized_texts['input_ids']
        attention_mask = tokenized_texts['attention_mask']

        # Ensure tensors are on the same device as the model
        input_ids = input_ids.to(model.device)
        attention_mask = attention_mask.to(model.device)

        outputs = model(input_ids, attention_mask=attention_mask)
        logits = outputs.logits
        probabilities = torch.softmax(logits, dim=1)
        predicted_labels = torch.argmax(probabilities, dim=1)
    
    df['label_fine_tune'] = predicted_labels.tolist()

def save_dataset(df, outfilepath):
    """
    Saves the labeled dataframe to GCP data bucket
    
    Input: Pandas dataframe, GCP file path
    Output: None

    >>> save_dataset(dataframe, 'filepath'):
    returns None
    """

    out_file = data_bucket.blob(outfilepath)
    df.to_csv(out_file, index=False)
    out_file.upload_from_filename(outfilepath)


# Load the pre-trained model and tokenizer
try: 
    model_directory = models_bucket.blob('fine_tune_label')
except:
    model_directory = models_bucket.blob('bert_label')

tokenizer, model = get_model(model_directory)

# Import labeled dataset 
initial_df = pd.read_csv(in_file)

# Filter high-confidence examples based on predicted sentiment scores
high_confidence_df = get_high_confidence_df(initial_df, 0.9)

# Get training and validation datasets 
train_data, valid_data = get_datasets(high_confidence_df, tokenizer, 0.2)

# Fine-tune the BERT model
train_bert(model, train_data, valid_data, epochs=3)

# Save the fine-tuned model to GCP
save_model('fine_tune_label', model, tokenizer)

# Label the full dataset using the fine-tuned model
label(model, initial_df)

# Export final dataframe to GCP
save_dataset(initial_df, 'processed/labeled_final.csv')

# TODO: Add weights and biases integration