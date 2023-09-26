# CLEAN AND LABELED DATA
FROM python:3.9-slim-buster

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV GOOGLE_APPLICATION_CREDENTIALS="/app/credentials.json"


# Install necessary system packages
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages via pip
RUN pip install --no-cache-dir \
    nltk \
    google-cloud-storage \
    pandas


# Set a working directory
WORKDIR /app

# Copy your application code into the container
COPY label_candidates.py /app/label_candidates.py
COPY GOOGLE_APPLICATION_CREDENTIALS /app/credentials.json

# Run the Python script
CMD ["python", "./label_candidates.py"]
