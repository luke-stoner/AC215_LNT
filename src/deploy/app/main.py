import os
import tempfile
import torch
from google.cloud import storage
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from flask import Flask, jsonify, request

app = Flask(__name__)

# Initialize Google Cloud Storage client
storage_client = storage.Client()

# Load tokenizer from the Hugging Face model hub
model_name = "siebert/sentiment-roberta-large-english"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name)

# Set bucket and model folder names
bucket_name = 'models-lnt'
folder_name = 'fine_tune_label'

# Establish temporary directory to store model.pth file
temp_dir = tempfile.TemporaryDirectory()

bucket = storage_client.bucket(bucket_name)
blob = bucket.blob(folder_name + '/model.pth')

# Download 'model.pth' from the GCS folder to the temporary directory
local_file_path = os.path.join(temp_dir.name, 'model.pth')
blob.download_to_filename(local_file_path)

# Set device to use GPU if available
device = "cuda" if torch.cuda.is_available() else "cpu"

# Load the model state dict and set model to eval mode
if device == 'cuda':
    model.load_state_dict(torch.load(local_file_path))
else:
    model.load_state_dict(torch.load(local_file_path, map_location=torch.device('cpu')))
model = model.to(device)
model.eval()

# Define health rotue
@app.route('/health')
def health():
    return "OK"

# Define prediction route
@app.route("/predict_sentiment", methods=["POST"])
def predict_sentiment():
    # Get json and instances
    req_json = request.get_json()
    instances = req_json["instances"]

    # List to store predicted sentiments
    predicted_sentiments = []
    # Predict sentiment for each input instance
    for instance in instances:
        input_text = instance.get("text")
        inputs = tokenizer(input_text, return_tensors="pt").to(device)
        
        with torch.no_grad():  # Disable gradient calculation for inference
            outputs = model(**inputs)
            predicted_class = torch.softmax(outputs.logits, dim=1).tolist()
            predicted_sentiments.append(predicted_class)

    return jsonify({
        "predictions": predicted_sentiments
    })
   

if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=8080)