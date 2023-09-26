import re
import csv
import os
from nltk.sentiment.vader import SentimentIntensityAnalyzer

"""
TODO: import candidate files for desired week
"""
candidate_files = os.listdir(f'candidate_files/unlabeled')
candidate_files.remove('.DS_Store')

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

#iterate through each candidate file in the directory
for file in candidate_files:
    """
    TODO: import files from google cloud to clean and label scraped mentions of each candidate
    """
    
    with open(f'candidate_files/{file}', 'r', newline='') as senator:
        csv_reader = csv.reader(senator)
        
        #create list of each mention in the file
        mentions = []
        for row in csv_reader:
            mentions.append(row)
        
    #create new list to store shortened text and base sentiment score
    labeled = []

    #iterate through each mention in candidate file
    for mention in mentions:
        #get cropped text
        cropped_mention = crop_text(mention[2])
        
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
        new_mention = [mention[0], mention[1], cropped_mention, label]
        labeled.append(new_mention)

    """
    TODO: export labeled data to google cloud
    """

