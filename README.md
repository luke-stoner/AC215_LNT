AC215-Template (Final Milestone)
==============================

For Milestone 2 - See branch `milestone2`

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
