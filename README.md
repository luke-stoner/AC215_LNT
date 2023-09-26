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

Next, the csv files are passed into label_candidates.py to be cleaned and provided a sentiment label. The text is shortened from ~200 words to between 50 and 100 words, terminating at the end of a sentence to capture proper context. The full scraped captions were too long and later portions typically did not relate to our desired candidate. Once cleaned, each caption is provided a basic sentiment label (0: Negative, 1: Neutral, 2: Positive) via NLTK's VADER. These labels will later be used to fine tune our pretrained BERT sentiment classifier.

**Preprocess container**
- This container reads 100GB of data and resizes the image sizes and stores it back to GCP
- Input to this container is source and destincation GCS location, parameters for resizing, secrets needed - via docker
- Output from this container stored at GCS location

(1) `src/preprocessing/preprocess.py`  - Here we do preprocessing on our dataset of 100GB, we reduce the image sizes (a parameter that can be changed later) to 128x128 for faster iteration with our process. Now we have dataset at 10GB and saved on GCS. 

(2) `src/preprocessing/requirements.txt` - We used following packages to help us preprocess here - `special butterfly package` 

(3) `src/preprocessing/Dockerfile` - This dockerfile starts with  `python:3.8-slim-buster`. This <statement> attaches volume to the docker container and also uses secrets (not to be stored on GitHub) to connect to GCS.

To run Dockerfile - `Instructions here`

**Cross validation, Data Versioning**
- This container reads preprocessed dataset and creates validation split and uses dvc for versioning.
- Input to this container is source GCS location, parameters if any, secrets needed - via docker
- Output is flat file with cross validation splits
  
(1) `src/validation/cv_val.py` - Since our dataset is quite large we decided to stratify based on species and kept 80% for training and 20% for validation. Our metrics will be monitored on this 20% validation set. 

(2) `requirements.txt` - We used following packages to help us with cross validation here - `iterative-stratification` 

(3) `src/validation/Dockerfile` - This dockerfile starts with  `python:3.8-slim-buster`. This <statement> attaches volume to the docker container and also uses secrets (not to be stored on GitHub) to connect to GCS.

To run Dockerfile - `Instructions here`

**Notebooks** 
This folder contains code that is not part of container - for e.g: EDA, any 🔍 🕵️‍♀️ 🕵️‍♂️ crucial insights, reports or visualizations. 

----
You may adjust this template as appropriate for your project.
