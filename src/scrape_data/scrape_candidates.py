
from google.cloud import storage
from selenium import webdriver
from selenium.webdriver.common.by import By
import time
import csv
import re
import pandas as pd
import os



#Initialize driver
url = 'https://archive.org/details/tv'
options = webdriver.ChromeOptions()
driver = webdriver.Chrome(options=options)

#define start/end dates for search
start_date = '2023-09-17'
end_date = '2023-09-20'

#import candidates
candidates = []
with open('candidates.csv', 'r', newline='') as infile:
    lines = csv.reader(infile)
    for line in lines:
        candidates.append(line)

mentions = []

for candidate in candidates[1:4]:
    #set candidate name and state
    first = candidate[0].strip('\ufeff')
    last = candidate[1]
    party = candidate[2]

    #set search url
    full_url = f'https://archive.org/details/tv?q="{first}+{last}"&and%5B%5D=publicdate%3A%5B{start_date}+TO+{end_date}%5D&page=1'

    #get webpage
    driver.get(full_url)

    #create list of all results on page
    results = driver.find_elements(By.CLASS_NAME, 'item-ia.hov')

    #scroll to bottom of webpage to access all results
    at_bottom = 0
    len_old_results = 0
    while at_bottom < 3:
        time.sleep(5)
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        len_old_results = len(results)
        results = driver.find_elements(By.CLASS_NAME, 'item-ia.hov')
        if len(results) > len_old_results:
            at_bottom = 0
        else:
            at_bottom += 1

    #iterate through results
    results = results[1:]
    for result in results: 
        #get network aired on
        network = result.find_element(By.CLASS_NAME, 'byv').text

        #get date
        link = result.get_attribute('data-id')
        date = link.split('_')[1]

        #get relevant text and clean it
        text = result.find_element(By.CLASS_NAME, 'sin-detail').text
        clean_text = text.replace('\'', '')
        clean_text = clean_text.replace('>', '')
        clean_text = re.sub(r'\[.*?\]', '', clean_text)

        #create list of network, date, text and append it to mention list
        entry = [first, last, party, network, date, clean_text]
        mentions.append(entry)


        

#write all mentions to output file
"""
TODO: export all candidate mentions to an output file on google cloud
"""

outfilepath = f'unlabeled.csv'
with open(outfilepath, 'w', newline='') as outfile:
    csv_writer = csv.writer(outfile)
    for entry in mentions:
        csv_writer.writerow(entry)


#upload csv to GCP
##create GCP Client
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/Users/andrewsullivan/Desktop/ac215-400221-4d622ff5cd5c.json"

storage_client = storage.Client()
bucket_name = "milestone2bucket"

bucket = storage_client.bucket(bucket_name)
blob = bucket.blob(outfilepath)
blob.upload_from_filename(outfilepath)
