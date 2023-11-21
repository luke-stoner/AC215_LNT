AC215-Template (Milestone 5)
==============================

For Milestone 4 - See branch `milestone4`

GitHub File Structure:
------------

      ├── LICENSE
      ├── README.md
      ├── api-service                      #Fetches current labeled data and saves to persistent disk
            ├── api
            │   ├── fetch_data.py          #Fetches data
            │   ├── service.py             #Creates FastAPI server
            ├── Dockerfile
            ├── docker-shell.sh
            ├── docker-entrypoint.sh 
            ├── Pipfile
            ├── pipfile.lock
      ├── frontend                         #Uses html/css/js structure to create user friendly frontend
            ├── Dockerfile
            ├── docker-shell.sh
            ├── index.html                 #Html file that calls all necessary css/js files and structures webapp
            ├── css
            │   ├── style.css
            ├── favicon
            │   ├── ...
            ├── fonts
            │   ├── ...
            ├── img                        #Stores candidate images and other graphics dependecies
            │   ├── ...
            ├── js                         #Contains all js files that are used to create visualizations
            │   ├── ...
      └── src
            ├── label
            │   ├── Dockerfile
            │   ├── label.ipynb
            │   ├── label.py
            │   └── requirements.txt
            ├── scrape
            │   ├── Dockerfile
            │   ├── scrape.ipynb
            │   ├── scrape.py
            │   └── requirements.txt
            └── summarize
                ├── Dockerfile
                ├── keywords.ipynb
                ├── keywords.py
                ├── summarize.ipynb
                └── requirements.txt
--------
          
**API-Service Container**
- Fetches most recent labeled.csv file from GCP Data Bucket on webapp startup
- Labeled data is then stored in persistent folder

**Frontend Container**
- Takes labeled.csv as input to produce scrollable visualization story 
- Uses javascript and D3 library to create interactive, costumizeable visualizations
- Will be continuously updated over the next 2-3 weeks
- **Frontend External IP:** http://34.69.165.89/
                
**Scrape Container**
- Scrapes specified data from Internet Archive and cleans/crops text to desired length
- Input to this container is a candidates.csv file listing each presidential candidate
- Output from this container is a csv file titled 'raw/unlabled.csv' stored in the data bucket on GCP

(1) `scrape.py & scrape.ipynb` - Runs data scraping through selenium and cleans/crops text

(2) `requirements.txt`

(3) `Dockerfile`

**Label Container**
- Manages the labeling of data using updated models and methods
- label.py and label.ipynb handle the labeling logic --> Uses pre-trained RoBERTa model 'siebert/sentiment-roberta-large-english'
- Fine tunes the pre-trained BERT model using hand labeled data
- Output from this container is first a csv file titled 'processed/labeled.csv' in our GCP data bucket, as well as the saved final model 'fine_tune_label' in our model's bucket on GCP
  
(1) `label.ipynb & label.py` - Takes unlabeled data are provides a sentiment label (0 or 1) through pre-trained RoBERTa model

(2) `Dockerfile` 

(3) `requirements.txt`

**Summarize Container**
- Summarizes text data

(1) `keywords.ipynb & keywords.py` - 

(2) `summarize.ipynb` 

(3) `Dockerfile`

(4) `requirements.txt`


GCP Bucket Structure:
------------
    ├── milestone2bucket                   #Archived bucket with milestone 2 deliverables
    ├── models-lnt                         #Bucket to store model information
            ├── fine_tune_label
            └── summarize
    └── data-lnt                           #Bucket to store all data
            ├── raw                        #directory for unprocessed data
                └── unlabeled.csv
                └── hand_labeled.csv
                └── candidates.csv
            └── processed                  #directory to store processed results from model
                └── labeled.csv
                └── summaries.csv
                └── keywords.csv

--------


**models-lnt**
- Bucket hosted on GCP for models

(1) `bert_label` - Untuned BERT model used to classify sentiment per candidate

(2) `fine_tune_label` - Fine-tuned BERT model 

(3) `summarize` -  Model that summarizes weekly news per candidate (to be completed at a later milestone)

**data-lnt**
- Bucket hosted on GCP gathering our scraped data

(1) `raw/unlabeled.csv` - Unlabeled data (updated weekly) to be passed into `fine_tune_label` model

(2) `raw/hand_labeled.csv` - Hand-labeled sample data to to train model

(3) `raw/candidates.csv` - candidate info

(4) `processed/labeled.csv` -  Final labeled data from fine-tuned BERT model (updated weekly) derived from `fine_tune_label` model

(5) `processed/summaries.csv` - Candidate summaries (updated weekly) derived from `bert_summarize` model

(6) `processed/keywords.csv` - CKeywords derived from `bert_summarize` model
