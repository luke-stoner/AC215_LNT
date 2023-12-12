"""
This script is scheduled to run once weekly. It first scrapes data from the 
Internet Archive, then accesses a Vertex AI endpoint to label the newly scraped
text. See following documentation for more information.
"""

#import libraries
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from google.cloud import storage
import os
import io
import re
import time
import pandas as pd
from datetime import datetime, timedelta
from google.cloud import aiplatform
from google.protobuf import json_format
from google.protobuf.struct_pb2 import Value
import os

# Set google application credentials
secrets_path = '/secrets/gcp_key.json'
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = secrets_path

"""
SCRAPE

This section of the code gets the current date and scrapes the Internet
Archive for the previous seven days of candidate mentions.

Output: Pandas Dataframe of mentions with candidate name, date, network, 
party, positive score, negative score, label
"""

# Get the current date and time
current_datetime = datetime.now() - timedelta(days=1)
seven_days_ago = current_datetime - timedelta(days=8)

# Set start and end date
END_DATE = str(current_datetime.strftime('%Y-%m-%d'))
START_DATE = str(seven_days_ago.strftime('%Y-%m-%d'))

# Create GCP client and set bucket name
storage_client = storage.Client()
bucket_name = 'data-lnt'

# Chrome options for headless mode
chrome_options = Options()
chrome_options.add_argument("--headless")

# Initialize driver in headless mode
driver = webdriver.Chrome(options=chrome_options)

def clean_text(text: str, max_words: int=100):
    '''
    Remove irrelevant characters and clip text at 50 words at the next sentence.
    Input:
    - text: str = input text from Internet Archive.
    - max_words: int = maximum number of words to consider if text contains more than max_words words.
    Output:
    - str = Cleaned and clipped text.
    '''
    # remove irrelevant characters
    text = text.replace('>', '')
    text = re.sub(r'\[.*?\]', '', text)

    # lowercase text and remove extra spaces
    text = text.lower()
    text = re.sub(' +',' ', text)
    
    # clip text at 50 words to the next complete sentence
    words = text.split()
    n_words = len(words)
    if n_words <= 50:
        return text
    else:
        for i in range(50, min(n_words, max_words)):
            punc = bool(re.search(r'[.!?]', words[i]))
            if not punc is False:
                break
        return(' '.join(words[:i+1]))
    
    
def fetch_results(first_name: str, last_name: str):
    '''
    Gathers results about candidate from Internet Archive using provided candidate 
    name and global start/end dates.

    Input:
    - first_name: str = candidate's first name.
    - last_name: str = candidate's last name.
    '''
    # internet archive url
    url = f'https://archive.org/details/tv?q="{first_name}+{last_name}"&and%5B%5D=publicdate%3A%5B{START_DATE}+TO+{END_DATE}%5D&page=1'
    # webpage
    driver.get(url)
    
    # list results on page
    results = driver.find_elements(By.CLASS_NAME, 'item-ia.hov')
    
    # scroll to bottom of webpage to prompt infinite scrolling and append further results
    at_bottom = 0
    len_old_results = 0
    while at_bottom < 5: # 5 tries to generate more results to accomate for slow load times
        time.sleep(5) # load time for each scroll attempt
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        len_old_results = len(results)
        results = driver.find_elements(By.CLASS_NAME, 'item-ia.hov')
        if len(results) > len_old_results:
            at_bottom = 0
        else:
            at_bottom += 1
    
    # drop first result (metadata)
    return results[1:]


def scrape():
    '''
    Fetches 'candidates.csv' file from google cloud storage bucket and then iterates through 
    each candidate, calling fetch_results() to scrape data. Once results for all candidates
    are collected, the function returns a pandas dataframe containing all mentions.
    
    Output:
    - pd.DataFrame = data frame of results; each row represents one mention of one candidate.
    '''
    # read list of candidates
    bucket_path = 'raw/candidates.csv'
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(bucket_path)
    content = blob.download_as_text()
    candidates_df = pd.read_csv(io.StringIO(content), names=['first_name', 'last_name', 'party'])
    
    # fetch data from Internet Archive
    mentions = []
    for _, row in candidates_df.iterrows():
        # candidate parameters
        first_name = row['first_name']
        last_name = row['last_name']
        party = row['party']

        # print current candidate 
        print(f'Scraping candidate: {last_name}')

        # fetch results from internet archive
        results = fetch_results(first_name, last_name)

        for result in results:
            # extract mention host network
            network = result.find_element(By.CLASS_NAME, 'byv').text
            
            # extract mention date
            link = result.get_attribute('data-id')
            date = link.split('_')[1]
            
            # extract mention text
            text = result.find_element(By.CLASS_NAME, 'sin-detail').text
            text = clean_text(text) 
            
            # append mention to dataframe
            mentions.append({
                'first_name': first_name,
                'last_name': last_name,
                'party': party,
                'network': network,
                'date': date,
                'text': text
            })
    
    # format as data frame
    mentions_df = pd.DataFrame(mentions)
    
    return mentions_df


"""
LABEL

This section of the code accesses our Vertex AI endpoint for sentiment prediction. 
The scraped data is sent to the endpoint in batches and a label is provided via our
fine-tuned RoBERTa model. Lastly, once all data is labeled, the new data is combined
with the existing dataset and saved both locally and to our GCP data bucket.

Output: 'labeled.csv' file containing existing data and the newly scraped data
"""

# Define project and endpoint variables
project="1092285729217"
endpoint_id="3030933544336621568"
location="us-central1"
api_endpoint = "us-central1-aiplatform.googleapis.com"

# Initialize Vertex AI client
client_options = {"api_endpoint": api_endpoint}
client = aiplatform.gapic.PredictionServiceClient(client_options=client_options)

# Fetch endpoint from vertex based on project, location, and ID
endpoint = client.endpoint_path(project=project, location=location, endpoint=endpoint_id)

def label(df, batch_size=50):
    '''
    Provided a pandas dataframe with all scraped mentions for the week, the function accesses
    our Vertex AI endpoint for prediction. Mentions are passed to the endpoint in batches of 
    100, where the text for each is provided a sentiment label of 0 or 1 (negative or positive).
    
    Output:
    pandas dataframe = data frame of results; each row represents one mention of one candidate.
    '''

    # Get the text column from the mentions dataframe and create a list of dictionaries
    mentions = df['text'].apply(lambda x: {'text': x}).tolist()

    # Create list to store sentiment scores
    scores = []

    # Iterate through each batch of mentions and get sentiment scores
    num_batches = (len(mentions) + batch_size - 1) // batch_size
    for i in range(num_batches):
        # Set start/end indicies
        start_idx = i * batch_size
        end_idx = min((i + 1) * batch_size, len(mentions))

        # Define batch
        batch = mentions[start_idx:end_idx]
        print(f"Processing batch {i + 1} of {num_batches}")

        # Prepare batch for json format required by vertex
        instances = [json_format.ParseDict(instance_dict, Value()) for instance_dict in batch]

        # Catch errors in endpoint response. Retry connection up to 10 times
        for _ in range(10):
            try:
                # Get response from endpoint based on defined instances
                response = client.predict(endpoint=endpoint, instances=instances)
                break  # Break the loop if successful response received
            except Exception as e:
                print(f"Error: {e}. Retrying...")
                # Retry the request
        else:
            raise RuntimeError('Failed to get a response after 10 attempts')

        # Extract predictions from endpoint response
        preds = response.predictions

        # Append sentiment scores to scores 
        [scores.append(pred[0]) for pred in preds]

    # Create 'negative_score' and 'positive_score' columns in dataframe
    df['negative_score'] = 0
    df['positive_score'] = 0

    # Append scores to the DataFrame columns
    for i, scores in enumerate(scores):
        df.at[i, 'negative_score'] = scores[0]
        df.at[i, 'positive_score'] = scores[1]

    # Create 'label' column based on sentiment scores
    df['label'] = df.apply(lambda row: 0 if row['negative_score'] > row['positive_score'] else 1, axis=1)

    return df


"""
SAVE AND EXPORT

In the final portion of this script, we combine this week's dataframe with previous data. It 
is first saved locally to our persistent disk, then pushed to our GCP data bucket.

Output: 'labeled.csv' file containing all candidate mentions (new and existing)
"""

def save_data(df):
    """
    Combines new data with exisiting data, then saves locally and uploads to GCP data bucket.

    Input:
    df: pandas dataframe with candidate mentions
    """
    
    # connect to GCP
    bucket_path = 'processed/labeled.csv'
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(bucket_path)

    # get existing data from unlabeled.csv
    content = blob.download_as_text()
    labeled_df = pd.read_csv(io.StringIO(content))
    labeled_df = labeled_df.dropna()

    # concat existing data and new data
    combined_df = pd.concat([labeled_df, df], ignore_index=True)

    # save combined df to persistent disk
    combined_df.to_csv("/persistent/data/labeled.csv", index=False)
    
    # upload CSV to bucket
    csv_string = combined_df.to_csv(index=False)
    blob.upload_from_string(csv_string)
    

"""
EXECUTE

The code below calls the necessary functions to complete the scraping -> labeling -> export process.
"""

# Scrape the internet archive and define unlabeled dataframe
unlabeled_df = scrape()

# Label the unlabeled dataframe using our Vertex AI endpoint
labeled_df = label(unlabeled_df)

# Combine the labeled df with existing data and export
save_data(labeled_df)
