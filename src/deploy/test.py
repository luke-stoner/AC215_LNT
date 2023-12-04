from google.cloud import aiplatform
from google.protobuf import json_format
from google.protobuf.struct_pb2 import Value
import os

# Set google application credentials
secrets_path = '~/secrets/ac215.json'
secrets_path = os.path.expanduser(secrets_path) 
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = secrets_path

# Define project and endpoint variables
project="1092285729217"
endpoint_id="3030933544336621568"
location="us-central1"
api_endpoint = "us-central1-aiplatform.googleapis.com"

# Initialize Vertex AI client
client_options = {"api_endpoint": api_endpoint}
client = aiplatform.gapic.PredictionServiceClient(client_options=client_options)

# Fetch endpoint from vertex based on project, location, and ID
endpoint = client.endpoint_path(project=project, location=location, endpoint=endpoint_id)

# Define mentions to be analyzed
mentions=[{ "text": "Joe biden is the worst"}, {"text": "Joe biden is the best"}, {"text": "I love donald trump"}]

# Prepare mentions for json format required by vertex
instances = [json_format.ParseDict(instance_dict, Value()) for instance_dict in mentions]

# Get response from endpoint based on defined instances
response = client.predict(endpoint=endpoint, instances=instances)

# Extract predictions from endpoint response
preds = response.predictions


print(preds)
