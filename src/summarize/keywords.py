import pandas as pd
import os
from google.cloud import storage
import io
from transformers import (
    TokenClassificationPipeline,
    AutoModelForTokenClassification,
    AutoTokenizer,
)
from transformers.pipelines import AggregationStrategy
import numpy as np
import torch

# Declare global variables
GCP_KEY = os.environ.get('GCP_KEY')
GCP_DATA_BUCKET = 'data-lnt'
GCP_SOURCE_FILENAME = 'raw/unlabeled.csv'
MODEL_SPECIFICATION = 'ml6team/keyphrase-extraction-kbir-inspec'
OUTPUT_FILEPATH = 'processed/keywords.csv'

#create GCP Client
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = GCP_KEY
storage_client = storage.Client()
bucket = storage_client.bucket(GCP_DATA_BUCKET)
source_filename = GCP_SOURCE_FILENAME
blob = bucket.blob(source_filename)
content = blob.download_as_text()

# Check if a GPU is available
if torch.cuda.is_available():
    # Set the device to the first available GPU
    device = torch.device("cuda:0")
else:
    # If no GPU is available, use the CPU
    device = torch.device("cpu")

# Print the device being used
print(f"Using device: {device}")


# Define keyphrase extraction pipeline
class KeyphraseExtractionPipeline(TokenClassificationPipeline):
    def __init__(self, model, *args, **kwargs):
        super().__init__(
            model=AutoModelForTokenClassification.from_pretrained(model),
            tokenizer=AutoTokenizer.from_pretrained(model),
            *args,
            **kwargs
        )

    def postprocess(self, all_outputs):
        results = super().postprocess(
            all_outputs=all_outputs,
            aggregation_strategy=AggregationStrategy.SIMPLE,
        )
        return np.unique([result.get("word").strip() for result in results])

    
def extract(dataframe):
    #initialize extraction dataframe
    extract_df = pd.DataFrame(columns=['first_name', 'last_name'])
    
    #get lists of candidate names and add to extract_df
    first_names = dataframe['first_name'].unique().tolist()
    last_names = dataframe['last_name'].unique().tolist()
    extract_df['first_name'] = first_names
    extract_df['last_name'] = last_names
    
    #initalize empty list to store candidate text
    candidate_text = []
    
    for first, last in zip(first_names, last_names):
        #get up to 100 random mentions of candidate
        candidate_df = df[df['last_name'] == last]
        try:
            candidate_df = candidate_df.sample(n=1000)
        except:
            pass
        
        #get mentions from random sample
        mentions = candidate_df['text'].tolist()
        
        #convert mentions list to one string
        text = ' '.join(mentions)
        
        #append text to candidate_text list
        candidate_text.append(text)

    #create key words
    extraction = extractor(candidate_text)
    
    #init list to stores key words and append key words for each candidate
    candidate_key_words = []
    for key_words in extraction:
        candidate_key_words.append(list(key_words))

    #append name, party, key words to df
    extract_df['first_name'] = first_names
    extract_df['last_name'] = last_names
    extract_df['key_words'] = candidate_key_words
    
    return extract_df


def save_dataset(df, outfilepath):
    """
    Saves the labeled dataframe to GCP data bucket
    
    Input: Pandas dataframe, GCP file path
    Output: None

    >>> save_dataset(dataframe, 'filepath'):
    returns None
    """
    #convert DataFrame to a CSV string
    csv_string = df.to_csv(index=False)

    #upload the CSV string to GCP
    blob = bucket.blob(outfilepath)
    blob.upload_from_string(csv_string)
    

#import unlabeled dataset into dataframe
df = pd.read_csv(io.StringIO(content))
df = df.dropna()

#define extraction pipeline
extractor = KeyphraseExtractionPipeline(model=MODEL_SPECIFICATION, device=device)

#create key word dataframe
extract_df = extract(df)

#save the output dataframe
save_dataset(extract_df, OUTPUT_FILEPATH)