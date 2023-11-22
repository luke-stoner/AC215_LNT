import os
import logging
import tempfile
import torch
from google.cloud import storage
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from flask import Flask, jsonify, request

logging.basicConfig(
    filename="app.log",
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Initialize Google Cloud Storage client using the service account key
service_account_key_path = os.path.expanduser('~/secrets/ac215.json')
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = service_account_key_path
storage_client = storage.Client()

# Load tokenizer from the Hugging Face model hub
tokenizer = AutoTokenizer.from_pretrained("siebert/sentiment-roberta-large-english")

# Define function to download 'model.pth' from GCS folder to a temporary directory
def download_model_to_temporary_dir():
    try:
        # Modify the bucket_name and folder_name variables as needed
        bucket_name = 'models-lnt'
        folder_name = 'fine_tune_label'
        temp_dir = tempfile.TemporaryDirectory()

        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(folder_name + '/model.pth')

        # Download 'model.pth' from the GCS folder to the temporary directory
        local_file_path = os.path.join(temp_dir.name, 'model.pth')
        blob.download_to_filename(local_file_path)

        return local_file_path
    except Exception as e:
        logger.error(f"Error downloading 'model.pth' from GCS: {str(e)}")
        return None

# Download 'model.pth' to a temporary directory
model_path = download_model_to_temporary_dir()

if model_path:
    # Load the fine-tuned model from 'model.pth'
    model = AutoModelForSequenceClassification.from_pretrained(model_path)
else:
    logger.error("Model loading failed. Check the logs for details.")


@app.route("/v1/endpoints/<endpoint_id>/deployedModels/<deployed_model_id>/sentiment", methods=["POST"])
def predict_sentiment(endpoint_id, deployed_model_id):
    try:
        # Validate and extract input_text from request JSON
        instances = request.json.get("instances")
        if not instances or not all(isinstance(instance, dict) for instance in instances):
            logger.error("Invalid input_text")
            return jsonify(error="Invalid input_text"), 400

        # Placeholder for predicted sentiments
        predicted_sentiments = []

        # Predict sentiment for each input instance
        for instance in instances:
            input_text = instance.get("sample_key")
            if not input_text or not isinstance(input_text, str):
                logger.error("Invalid input_text in one or more instances")
                return jsonify(error="Invalid input_text in one or more instances"), 400

            inputs = tokenizer(input_text, return_tensors="pt")
            
            # Ensure the model is in evaluation mode
            model.eval()
            
            with torch.no_grad():  # Disable gradient calculation for inference
                outputs = model(**inputs)
                predicted_class = torch.softmax(outputs.logits, dim=1)
                predicted_sentiments.append(predicted_class)

        # Return the predicted sentiments
        return jsonify(sentiments=predicted_sentiments), 200

    except Exception as e:
        # Log the error for debugging purposes
        logger.error(f"Error: {str(e)}")
        # Provide a response to the user
        return jsonify(error=f"Internal server error: {str(e)}"), 500

@app.route("/v1/endpoints/<endpoint_id>/deployedModels/<deployed_model_id>", methods=["GET"])
def get_model_info(endpoint_id, deployed_model_id):
    try:
        # [Optional] You may use endpoint_id and deployed_model_id to
        # manage and fetch specific model info
        # Example: Fetch and return some information about the model
        model_info = {
            "model_name": "Sentiment Analysis - siebert/sentiment-roberta-large-english",
            "endpoint_id": endpoint_id,
            "deployed_model_id": deployed_model_id,
        }
        return jsonify(model_info), 200

    except Exception as e:
        # Log the error for debugging purposes
        logger.error(f"Error: {str(e)}")
        # Provide a response to the user
        return jsonify(error=f"Internal server error: {str(e)}"), 500

if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=8080)

