#import necessary libraries 
import torch
from torch.nn.functional import softmax
import pandas as pd
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import os
from google.cloud import storage
import io

#create GCP Client
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/Users/lu31635/Desktop/AC215/ac215.json"
storage_client = storage.Client()
bucket = storage_client.bucket('data-lnt')
source_filename = 'raw/unlabeled.csv'
blob = bucket.blob(source_filename)
content = blob.download_as_text()

def get_model(model_name):
    """
    Input: model_name (name of desired BERT model)
    Output: tokenizer, model

    >>> get_model("cardiffnlp/twitter-xlm-roberta-base-sentiment")
    tokenizer(model_name), model(model_name)
    """
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSequenceClassification.from_pretrained(model_name)

    return tokenizer, model

def tokenize(dataframe):
    """
    Input: Pandas dataframe (assumes text column = 'text')
    Output: tokenized text

    >>> tokenize(df)
    tokenized_texts
    """
    text_samples = dataframe['text'].tolist()
    tokenized_texts = tokenizer(text_samples, padding=True, truncation=True, return_tensors="pt")

    return tokenized_texts

def get_scores(model_outputs, dataframe):
    """
    Input: BERT Model Output and desired dataframe
    Output: New DF Columns for Negative, Netural, Positive, and Final Predicted Label

    >>> get_scrores(outputs, dataframe):
    returns None
    """
    #define output logits
    logits = model_outputs.logits

    #calculate softmax probabilities for each class
    probs = softmax(logits, dim=1).tolist()

    #extract the raw scores for each sentiment class
    negative_scores = [score[0] for score in probs]
    neutral_scores = [score[1] for score in probs]
    positive_scores = [score[2] for score in probs]

    #map the predicted labels to sentiment categories
    sentiment_labels = ["Negative", "Neutral", "Positive"]
    predicted_labels = [sentiment_labels[label] for label in torch.argmax(logits, dim=1).tolist()]

    #add the scores and predicted labels to the DataFrame
    dataframe['negative_score'] = negative_scores
    dataframe['neutral_score'] = neutral_scores
    dataframe['positive_score'] = positive_scores
    dataframe['predicted_sentiment'] = predicted_labels

def save_dataset(df, outfilepath):
    """
    Saves the labeled dataframe to GCP data bucket
    
    Input: Pandas dataframe, GCP file path
    Output: None

    >>> save_dataset(dataframe, 'filepath'):
    returns None
    """
    out_file = bucket.blob(outfilepath)
    df.to_csv(out_file, index=False)
    out_file.upload_from_filename(outfilepath)


#import unlabeled dataset into dataframe
df = pd.read_csv(io.StringIO(content), names= ['first', 'last', 'party', 'network', 'date', 'text'])

#define BERT model and tokenized text
tokenizer, model = get_model("cardiffnlp/twitter-xlm-roberta-base-sentiment")
tokenized_texts = tokenize(df)

#conudct sentiment analysis with non fine-tuned bert model
with torch.no_grad():
    outputs = model(**tokenized_texts)

#update unlabeled dataframe with sentiment scores
get_scores(outputs, df)

#export dataframe to csv on GCP
save_dataset(df, 'processed/labeled_initial.csv')