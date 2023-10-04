import re
import csv
from google.cloud import storage 
import os
import nltk
nltk.download('vader_lexicon')
from nltk.sentiment.vader import SentimentIntensityAnalyzer


##create GCP Client
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/Users/andrewsullivan/Desktop/ac215-400221-4d622ff5cd5c.json"
source_filename = f'unlabeled.csv'
storage_client = storage.Client()
bucket_name = "milestone2bucket"
bucket = storage_client.bucket(bucket_name)
in_file = bucket.blob(source_filename)
# Download the file from GCS to your local machine
in_file.download_to_filename(source_filename)


#define function that shortens text to between 50 to 100 words, cropping at end of sentence if possible
def crop_text(text):
    words = text.split()
    if len(words) <= 50:
        return text
    elif len(words) >= 100:
        for i in range(50,100):
            punc = bool(re.search(r'[.!?]', words[i]))
            if not punc is False:
                break
        return(' '.join(words[:i+1]))
    else:
        for i in range(50,len(words)):
            punc = bool(re.search(r'[.!?]', words[i]))
            if not punc is False:
                break
        return(' '.join(words[:i+1]))


"""
TODO: import unlabeled file from google cloud to clean and label scraped mentions of each candidate
"""
with open(source_filename, 'r', newline='') as unlabled:
    csv_reader = csv.reader(unlabled)
    #create list of each mentions
    mentions = []
    for row in csv_reader:
        mentions.append(row)
    
#create new list to store shortened text and base sentiment score
labeled = []

#iterate through each mention in unlabeled file
for mention in mentions:
    #get cropped text
    cropped_mention = crop_text(mention[-1])
    
    #initialize VADER and evaluate sentiment
    analyzer = SentimentIntensityAnalyzer()
    sentiment_scores = analyzer.polarity_scores(cropped_mention)
    
    #use compound score to determine final label (negative, neutral, positive)
    compound_score = sentiment_scores['compound']
    if compound_score <= -0.05:
        label = 0
    elif compound_score >= 0.05:
        label = 2
    else:
        label = 1

    #write final new row with cropped text and label and append to labeled list
    new_mention = [mention[0], mention[1], mention[2], mention[3], mention[4], cropped_mention, label]
    labeled.append(new_mention)

"""
TODO: export labeled data to google cloud
"""
outfilepath = f'labeled.csv'
with open(outfilepath, 'w', newline='') as outfile:
    csv_writer = csv.writer(outfile)
    for entry in labeled:
        csv_writer.writerow(entry)

out_file = bucket.blob(outfilepath)
out_file.upload_from_filename(outfilepath)