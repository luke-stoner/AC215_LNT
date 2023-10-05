import torch
from torch.nn.functional import softmax
import pandas as pd
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import os
from google.cloud import storage 

##create GCP Client
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/Users/andrewsullivan/Desktop/ac215-400221-4d622ff5cd5c.json"
source_filename = f'output/initial_labels.csv'
storage_client = storage.Client()
bucket_name = "milestone3bucket"
bucket = storage_client.bucket(bucket_name)
in_file = bucket.blob(source_filename)
# Download the file from GCS to your local machine
in_file.download_to_filename(source_filename)

#initialize tokenizer and BERT model
model_name = "output/sentiment_finetuned_model"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name)

#import week's dataset to be labeled
df = pd.read_csv('input/unlabeled/date.csv')

#create list of text samples
text_samples = df['text'].tolist()

# Tokenize and preprocess the text samples
tokenized_texts = tokenizer(text_samples, padding=True, truncation=True, return_tensors="pt")

#conudct sentiment analysis 
with torch.no_grad():
    outputs = model(**tokenized_texts)

#define output logits
logits = outputs.logits

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
df['negative_score'] = negative_scores
df['neutral_score'] = neutral_scores
df['positive_score'] = positive_scores
df['predicted_sentiment'] = predicted_labels

#export dataframe to csv
#export dataframe to csv
outfilepath = f'output/final_labels.csv'
out_file = bucket.blob(outfilepath)
df.to_csv(out_file, index=False)
out_file.upload_from_filename(outfilepath)
