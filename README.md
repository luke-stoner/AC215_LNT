Team LNT: AC215 Final Project
==============================

GitHub File Structure:
------------

      ├── LICENSE
      ├── README.md
      ├── api-service                      #Fetches current labeled data and saves to persistent disk
            ├── api
            │   ├── scrape_and_label.py          #Scrapes data from Internet Archive and uses Vertex endpoint to provide sentiment label
            │   ├── service.py                   #Creates FastAPI server
            |   └── sync_data.sh                 #Syncs newest labeled.csv file with data folder in frontend
            ├── Dockerfile
            ├── docker-shell.sh
            ├── docker-entrypoint.sh 
            ├── docker-push.sh 
            ├── Pipfile
            ├── pipfile.lock
      ├── frontend                         #Uses html/css/js structure to create user friendly frontend
            ├── Dockerfile
            ├── docker-shell.sh
            ├── docker-push.sh
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
      ├── scaling                          #Stores all yaml and docker files necessary for kubernetes deployment of our api and frontend
            ├── frontend-deployment.yaml    
            ├── frontend-service.yaml  
            ├── api-deployment.yaml  
            ├── api-service.yaml  
            ├── Dockerfile
            ├── docker-shell.sh   
      └── src
            ├── label                      #Defines our sentiment analysis model to later be deployed in our deploy container
            │   ├── Dockerfile
            │   ├── label.ipynb
            │   ├── label.py
            │   └── requirements.txt
            ├── scrape                     #Scrapes the Internet Archive to get candidate mentions in the past week
            │   ├── Dockerfile
            │   ├── scrape.ipynb
            │   ├── scrape.py
            │   └── requirements.txt
            ├── summarize                  #Randomly samples candidate mentions to create summaries and extract keywords
            |   ├── Dockerfile
            |   ├── keywords.ipynb
            |   ├── keywords.py
            |   ├── summarize.ipynb
            |   └── requirements.txt
            └── deploy                     #Creates a flask app using or model to take in text input and return negative/positive sentiment scores
                ├── Dockerfile
                ├── docker-push.sh
                ├── pyproject.toml
                ├── requirements.txt
                └── test.py                #Basic script to test function of vertex endpoint
--------

**Solution Architechture**
<img width="917" alt="SolutionArchitecture" src="https://github.com/luke-stoner/AC215_LNT/assets/146034759/2c4a2c59-cf0e-4944-8dc9-5dd00bec1eac">

**Technical Architechture**
<img width="913" alt="TechnicalArchitechture" src="https://github.com/luke-stoner/AC215_LNT/assets/146034759/1cf9e0d6-67af-4c4d-9d2f-f43730042100">
          
**API-Service Container**
- Uses FastAPI to create API Server
- Scrapes data weekly from the Internet Archive and accesses our Vertex endpoint to label newly scraped data
- Process is automated via cron jobs
- New labeled data is pushed to both Google Cloud Storage and our frontend data folder

**Frontend Container**
- Takes labeled.csv as input to produce scrollable visualization story 
- Uses javascript and D3 library to create interactive, costumizeable visualizations
- Continuously updated on Sunday each week
- We recommend visiting our frontend using Chrome or Firefox for best performance
- **Frontend External IP:** http://34.122.185.215/

**Scaling Container**
- Handles the deployment of our frontend and api-service to our Kubernetes Cluster
- Contains yaml files for deployment and services
- Dockerfile and docker-shell.sh automate deployment process for future use in Github Actions
                
**Scrape Container**
- Scrapes specified data from Internet Archive and cleans/crops text to desired length
- Input to this container is a candidates.csv file listing each presidential candidate
- Output from this container is a csv file titled 'raw/unlabled.csv' stored in the data bucket on GCP

**Label Container**
- Manages the labeling of unlabeled.csv file
- label.py and label.ipynb handle the labeling logic --> Uses pre-trained RoBERTa model 'siebert/sentiment-roberta-large-english'
- Fine tunes the pre-trained BERT model using hand-labeled data
- Output from this container is first a csv file titled 'processed/labeled.csv' in our GCP data bucket, as well as the saved final model 'fine_tune_label' in our model's bucket on GCP


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


