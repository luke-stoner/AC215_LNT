# SCRAPE DATA DOCKERFILE
FROM python:3.9-slim-buster

# For additional security, the secrets are mounted only at runtime - this prevents secrets being stored and exposed in docker image
# At runtime, a local folder is mounted into the docker image, using the -v command
# Example:
# docker run -v /file/location/locally/gcp_key.json:/container/destination/path/gcp_key.json -it imagename /bin/bash
# docker run -v /Users/johannes/Desktop/ac215/secrets/gcp_key.json:/app/secrets/gcp_key.json -it imagename /bin/bash


# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive

# Set a working directory
WORKDIR /app

# Copy your application code into the container
COPY scrape_candidates.py /app/scrape_candidates.py
COPY candidates.csv /app/candidates.csv
COPY requirements.txt /app/requirements.txt

# Install necessary system packages
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    chromium \
    chromium-driver \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages via package manager
RUN pip install --no-cache-dir -r requirements.txt

# Set up the Chrome WebDriver for Selenium in Environment variables
#ENV CHROME_DRIVER_PATH=/usr/lib/chromium/chromedriver
#ENV CHROME_BIN_PATH=/usr/bin/chromium-browser
#ENV PATH=$PATH:$CHROME_DRIVER_PATH
ENV PATH /usr/lib/chromium/:$PATH



# Run the Python script
CMD ["python", "./scrape_candidates.py"]
