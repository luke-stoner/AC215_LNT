import pandas as pd
from nltk.sentiment.vader import SentimentIntensityAnalyzer
import os
import io
from google.cloud import storage

# Declare global variables
GCP_DATA_BUCKET = 'data-lnt'
GCP_SOURCE_FILENAME = 'raw/unlabeled.csv'
OUTPUT_FILEPATH = 'processed/vader_labeled_initial.csv'

#create GCP Client
storage_client = storage.Client()
bucket = storage_client.bucket(GCP_DATA_BUCKET)
source_filename = GCP_SOURCE_FILENAME
blob = bucket.blob(source_filename)
content = blob.download_as_text()

def label(dataframe):
    """
    Uses NLTK's VADER to evaluate the unlabeled dataset. Labels are added 
    to the dataframe based on the label provided by the model.

    Input: tokenized_texts, model, device, dataframe, batch_size
    Output: None
    """  
    #define sentiment analyzer from NLTK Vader
    analyzer = SentimentIntensityAnalyzer()

    #get all text from dataframe
    mentions = dataframe['text'].tolist()

    #define list to store all labels
    labels = []

    #loop through all mentions
    for mention in mentions:

        #Evaluate sentiment of text
        sentiment_scores = analyzer.polarity_scores(mention)
        
        #use compound score to determine final label (negative, neutral, positive)
        compound_score = sentiment_scores['compound']

        if compound_score <= -0.05:
            label = 0
        elif compound_score >= 0.05:
            label = 2
        else:
            label = 1

        #write label to full label list
        labels.append(label)

    dataframe['vader_label'] = labels

    return dataframe

def save_dataset(dataframe, outfilepath):
    """
    Saves the labeled dataframe to GCP data bucket
    
    Input: Pandas dataframe, GCP file path
    Output: None

    >>> save_dataset(dataframe, 'filepath'):
    returns None
    """
    #convert DataFrame to a CSV string
    csv_string = dataframe.to_csv(index=False)

    #upload the CSV string to GCP
    blob = bucket.blob(outfilepath)
    blob.upload_from_string(csv_string)

#import unlabeled dataset into dataframe
df = pd.read_csv(io.StringIO(content))
df = df.dropna()

#label the dataset
df = label(df)

#save the dataframe to GCP
save_dataset(df, OUTPUT_FILEPATH)