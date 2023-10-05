from google.cloud import storage
import os, re, time
import pandas as pd
from selenium import webdriver
from selenium.webdriver.common.by import By

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
    text = text.replace('\'', '')
    text = text.replace('>', '')
    text = re.sub(r'\[.*?\]', '', text)

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
    # initialize driver
    # options = webdriver.ChromeOptions()
    # driver = webdriver.Chrome(options=options)
    driver = webdriver.Chrome()

    # internet archive url
    url = f'https://archive.org/details/tv?q="{first_name}+{last_name}"&and%5B%5D=publicdate%3A%5B{START_DATE}+TO+{END_DATE}%5D&page=1'

    # webpage
    driver.get(url)

    # list results on page
    results = driver.find_elements(By.CLASS_NAME, 'item-ia.hov')

    # scroll to bottom of webpage to prompt infinite scrolling and append further results
    at_bottom = 0
    len_old_results = 0
    while at_bottom < 3: # 3 tries to generate more results to accomate for slow load times
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

def upload_to_GCP(file_path: str):
    '''
    Upload local file to GCP data bucket.

    Input:
    file_path: str = path to file to upload.
    '''
    # load credentials
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = "secrets/GCP_secrets.json"

    # connect to GCP
    bucket_name = 'data'
    bucket_path = 'raw/unlabeled.csv'
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)

    # upload CSV to bucket
    blob = bucket.blob(bucket_path)
    blob.upload_from_filename(file_path)

def scrape():
    '''
    Scrape Internet Archive mentions between START_DATE and END_DATE for all candidates in candidates.csv.
    
    Output:
    - pd.DataFrame = data frame of results; each row represents one mention of one candidate.
    '''
    # read list of candidates
    candidates_df = pd.read_csv('candidates.csv', names=['first_name', 'last_name', 'party'])

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
    START_DATE = '2023-09-17'
    END_DATE = '2023-09-20'

    mentions_df = scrape()