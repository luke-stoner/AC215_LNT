AC215-Template (Milestone 4)
==============================

For Milestone 3 - See branch `milestone3`

GitHub File Structure:
------------
      ├── LICENSE
      ├── README.md
      ├── requirements.txt
      └── src
            ├── scrape_data              
            │   ├── Dockerfile
            │   ├── scrape_candidates.py
            │   └── requirements.txt
            └── bert_label_initial
            │   ├── Dockerfile
            │   ├── bert_label_initial.py
            │   └── requirements.txt
            └── bert_train
                ├── Dockerfile
                ├── bert_fine_tune.py
                └── requirements.txt
                
**scrape_data container**
- Scrapes desired data from Internet Archive and cleans/crops text to desired length
- Input to this container is a candidates.csv file listing each presidential candidate
- Output from this container is a csv file titled 'raw/unlabled.csv' stored in the data bucket on GCP

(1) `scrape_candidates.py` - Runs data scraping through selenium and cleans/crops text

(2) `requirements.txt` 

(3) `Dockerfile` 

**bert_label_initial container**
- Uses pretrained BERT model 'cardiffnlp/twitter-xlm-roberta-base-sentiment' to provide initial label to unlabeled data
- Input to this container is the unlabeled.csv file from the scrape_data container
- Output from this container is a csv file titled 'processed/labeled_initial.csv' in our GCP data bucket
  
(1) `bert_label_initial.py` - Takes unlabeled data are provides an initial sentiment label through pretrained BERT model

(2) `requirements.txt` 

(3) `src/validation/Dockerfile`

**bert_label_final container**
- Fine tunes the pretrained BERT model through high confidence samples, then uses the fine tuned model to provide final sentiment label
- Input to this container is the labeled_initial.csv file from the bert_label_initial container
- Output from this container is first a csv file titled 'processed/labeled_final.csv' in our GCP data bucket, as well as the saved final model 'fine_tune_label' in our models bucket on GCP
  
(1) `bert_label_initial.py` - Takes unlabeled data are provides an initial sentiment label through pretrained BERT model

(2) `requirements.txt` 

(3) `src/validation/Dockerfile`


GCP Bucket Structure:
------------
    ├── milestone2bucket                   #Archived bucket with milestone 2 deliverables
    ├── models-lnt                         #Bucket to store model information
            ├── bert_label
            ├── fine_tune_label
            └── bert_summarize
    └── data-lnt                           #Bucket to store all data
            ├── raw                        #directory for unprocessed data
                └── unlabeled.csv
            └── processed                  #directory to store processed results from model
                └── labeled_initial.csv
                └── labeled_final.csv
                └── summaries.csv

--------


**models-lnt**
- Bucket hosted on GCP for models

(1) `bert_label` - Untuned BERT model used to classify sentiment per candidate

(2) `fine_tune_label` - Fine-tuned BERT model 

(3) `bert_summarize` -  Model that will summarize weekly news per candidate (to be completed at a later milestone)

**data-lnt**
- Bucket hosted on GCP gathering our scraped data

(1) `raw/unlabeled.csv` - Unlabeled data (updated weekly) to be passed into `fine_tune_label` model

(2) `processed/labeled_initial.csv` - Initial labeled data from pretrained BERT model (updated weekly) derived from `bert_label` model

(3) `processed/labeled_final.csv` - Final labeled data from fine-tuned BERT model (updated weekly) derived from `fine_tune_label` model

(4) `processed/summaries.csv` - Candidate summaries (updated weekly) derived from `bert_summarize` model
