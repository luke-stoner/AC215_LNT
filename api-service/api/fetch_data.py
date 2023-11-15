import asyncio
from google.cloud import storage
import os

#set globals and initialize storage client
bucket_name = "data-lnt"
local_data_path = "/persistent/data/"
source_blob_name = "processed/labeled.csv"
storage_client = storage.Client.create_anonymous_client()

# Setup data folder
if not os.path.exists(local_data_path):
    os.mkdir(local_data_path)

async def fetch_data():
    # Get the bucket and file details
    destination_file_name = f'{local_data_path}labeled.csv'

    # Download the file from the bucket
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(source_blob_name)
    blob.download_to_filename(destination_file_name)
    print(f"Downloaded file {source_blob_name} to {destination_file_name}")

