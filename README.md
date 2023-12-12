Team LNT: AC215 Final Project
==============================

Team Members: Luke Stoner, Andrew Sullivan

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

------------


Data Description:
------------
`labeled.csv` data fields:

- first_name: The first name of the mentioned candidate
- last_name: The last name of the mentioned candidate
- party: Abbreviation for the political party of the mentioned candidate
- network: The network the mention occurred on
- date: The date on which the clip aired
- text: Cleaned and cropped closed caption text of the mention
- negative_score: The confidence in which the model would predict the text is negative 
- positive_score: The confidence in which the model would predict the text is positive
- label: Final sentiment label of the mention (0=negative, 1=positive)


Use of our Repository:
-------------
We will now walk through the steps you can take to reproduce our app "Race for the White House."
We recommend cloning this repository to start.

### Data Scraping
To create an inital dataset, run the `scrape.py` script in the scrape container. Specify the dates the you are interested in exploring. 
For our app, we started our dataset with mentions as early as June 1st. 

### Modeling
Use either the `label.py` or `label.ipynb` to create and train the sentiment anaylsis model. Personally, we used a VM instance on Vertex AI
workbench to craft our jupyter notebooks and initalize the model

### Model Deployment
Once a final model is created, it should be stored in a GCP Storage Bucket to be accessed by the deployment app. `App.py` in our deploy container
specifies a Flask app that takes text instances as input, then imports the model from GCP to provide all text a postive and negative sentiment score.

With this app created and containerized, upload the docker image to Google Artifact Registry. Next, go to https://console.cloud.google.com/vertex-ai/ 
and complete the following in Vertex AI's UI:
- Navigate to Model Registry and click import to create a model based on our docker image
- Upon importing the model, be sure that the predict and health paths match those of the Flask app
- Once the model is successfully deployed, click on it and navigate to Deploy and Test -> Deploy to Endpoint
- Specify necessary compute resources for the endpoint, we recommend including a GPU accelerator for labeling

On completion of those steps, the Vertex AI endpoint should be active and ready to return predictions. 
`Test.py` in our deploy container is useful for testing the effectiveness of the endpoint. If eveything is working properly, you should see something 
like the below image on Vertex:

<img width="421" alt="Screenshot 2023-12-12 at 4 54 22 PM" src="https://github.com/luke-stoner/AC215_LNT/assets/146034759/100fe4e2-084c-4222-87f1-b0f330b8da52">

### API and Frontend

The `api-service` and `frontend` directories make use of our newly created dataset and deployed model. The Docker files in each container specify how each should
be deployed to their respective servers. The API is run on Uvicorn server, while our frontend uses NGINX. We recommend attempting to build a run these containers
locally first before pushing to DockerHub. Additionally, most of these files make use of Github Actions secrets; make necessary changes to enure make sure the 
containers run locally first.

We also recommend exploring and making edits to our `index.html` file and our `js` directory, which create the visualizations for our frontend. Here are some examples 
of our candidate and network visualizations:

<img width="600" alt="Screenshot 2023-12-12 at 12 34 53 AM" src="https://github.com/luke-stoner/AC215_LNT/assets/146034759/d6dcc01a-51f3-4087-a511-a459fe733ed2">

<img width="600" alt="Screenshot 2023-12-12 at 12 33 55 AM" src="https://github.com/luke-stoner/AC215_LNT/assets/146034759/8cabda0b-dd1c-4b32-8edb-a3b18089121e">
