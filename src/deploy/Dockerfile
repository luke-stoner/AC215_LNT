FROM python:3.9-slim

# Install libraries
COPY ./requirements.txt ./
RUN pip install -r requirements.txt && \
    rm ./requirements.txt

# Setup container directories
RUN mkdir /app

# Create a directory for the credentials and copy the JSON key
RUN mkdir -p /app/secrets

# Copy the GCP key into the container
COPY gcp-key.json /app/secrets/gcp-key.json

# Set environment variable for GCP key
ENV GOOGLE_APPLICATION_CREDENTIALS=/app/secrets/gcp-key.json

# Copy the rest of the application code
COPY ./app /app

# launch server with gunicorn
WORKDIR /app
EXPOSE 8080
CMD ["gunicorn", "main:app", "--timeout=0", "--preload", \
     "--workers=1", "--threads=4", "--bind=0.0.0.0:8080"]