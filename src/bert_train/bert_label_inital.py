import torch
from torch.nn.functional import softmax
import pandas as pd
from transformers import AutoTokenizer, AutoModelForSequenceClassification

#initialize tokenizer and BERT model
model_name = "cardiffnlp/twitter-xlm-roberta-base-sentiment"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name)

#import master dataset into dataframe
df = pd.read_csv('input/unlabeled/master.csv')

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
df.to_csv('output/initial_labels.csv', index=False)