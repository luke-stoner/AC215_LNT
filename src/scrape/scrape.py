#import libraries and set GCP key
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
GCP_KEY = os.environ.get('GCP_KEY')

# Get the current date and time
current_datetime = datetime.now()
seven_days_ago = current_datetime - timedelta(days=7)

# Set start and end date
end_date = str(current_datetime.strftime('%Y-%m-%d'))
start_date = str(seven_days_ago.strftime('%Y-%m-%d'))

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
    Gathers results about candidate from Internet Archive.

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


def upload_to_GCP(df, file_path: str):
    '''
    Upload local file to GCP data bucket.

    Input:
    df: pandas dataframe with candidate mentions
    file_path: str = path to file to upload.
    '''
    # load credentials
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = GCP_KEY
    
    # connect to GCP
    bucket_path = 'raw/unlabeled.csv'
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(bucket_path)

    # get existing data from unlabeled.csv
    content = blob.download_as_text()
    unlabeled_df = pd.read_csv(io.StringIO(content))
    unlabeled_df = unlabeled_df.dropna()

    # concat existing data and new data
    combined_df = pd.concat([unlabeled_df, df], ignore_index=True)

    # upload CSV to bucket
    csv_string = combined_df.to_csv(index=False)
    blob.upload_from_string(csv_string)


def scrape():
    '''
    Scrape Internet Archive mentions between START_DATE and END_DATE for all candidates in candidates.csv.
    
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
    
    # save to disk
    outfilepath = 'unlabeled.csv'
    mentions_df.to_csv(outfilepath)
    
    # upload to GCP
    upload_to_GCP(outfilepath)
    return mentions_df


if __name__ == '__main__':
    START_DATE = start_date
    END_DATE = end_date
    mentions_df = scrape()