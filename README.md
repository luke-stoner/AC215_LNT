AC215-Template (Milestone2)
==============================

AC215 - Milestone2

Project Organization
------------
      ├── LICENSE
      ├── README.md
      ├── requirements.txt
      └── src
            ├── scrape_data
            │   ├── Dockerfile
            │   ├── scrape_candidates.py
            │   └── requirements.txt
            └── clean_and_label
                  ├── Dockerfile
                  ├── label_candidates.py
                  └── requirements.txt


--------
# AC215 - Milestone2 - Last Night Today

**Team Members**
Luke Stoner, Evan Arnold, Andrew Sullivan, Johannes Portik

**Group Name**
LNT (Last Night Today)

**Project**
This project aims to scrape closed caption data from TV news programs via the Internet Archive and create a website that provides a snapshot of the previous night's news. Specifically, we aim to capture the overall sentiment of various networks, along with sentiment toward current presidential candidates. Additionally, we aim to train an LLM to complete summarization tasks given clips from each night's news.

### Milestone2 ###

For this milestone we wrote initial dockerfiles and scripts to complete our data collection and preprocessing tasks. 

For data collection, we scrape captions from the internet archive (via scrape_candidates.py) for each presidential candidate and store the scraped text, along with date and network, to an output csv file. For future milestones, we will streamline our scraping via an API solution rather than raw scraping to conserve resources. While the current solution is operable and works well on a local machine, we need a more feasible solution within a container on GCP.

Next, the csv file is passed into label_candidates.py to be cleaned and provided a sentiment label. The text is shortened from ~200 words to between 50 and 100 words, terminating at the end of a sentence to capture proper context. The full scraped captions were too long and later portions typically did not relate to our desired candidate. Once cleaned, each caption is provided a basic sentiment label (0: Negative, 1: Neutral, 2: Positive) via NLTK's VADER. These labels will later be used to fine tune our pretrained BERT sentiment classifier.

**scrape_data container**
- Scrapes desired data from Internet Archive
- Input to this container is a candidates.csv file listing each presidential candidate
- Output from this container is a csv file currently titled 'unlabled.csv' stored in our milestone 2 bucket on GCP

(1) `scrape_candidates.py` - Runs data scraping through selenium as previously described

(2) `requirements.txt` - We used the following packages to help us scrape here - `selenium pandas google-cloud-storage` 

(3) `Dockerfile` 


**clean_and_label container**
- Cleans and labels scraped text
- Input to this container is the unlabeled.csv file from the scrape_data container
- Output from this container is a csv file currently titled 'labeled.csv' stored in our milestone 2 bucket on GCP
  
(1) `label_candidates.py` - Cleans and labels data through NLTK as previously described

(2) `requirements.txt` - We used following packages to help us with cleaning and labeling here - `nltk pandas google-cloud-storage` 

(3) `src/validation/Dockerfile`


