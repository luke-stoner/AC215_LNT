FROM pytorch/pytorch:2.0.0-cuda11.7-cudnn8-runtime

# Set the working directory
WORKDIR /app

# Copy dependencies file and install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Create a directory for the credentials and copy the JSON key
RUN mkdir -p /app/secrets
COPY ~/secrets/ac215.json /app/secrets/

# Set the environment variable for Google Cloud credentials
ENV GOOGLE_APPLICATION_CREDENTIALS=/app/secrets/ac215.json

# Copy the rest of the application code
COPY app.py ./

# Start the application
CMD ["python", "app.py"]