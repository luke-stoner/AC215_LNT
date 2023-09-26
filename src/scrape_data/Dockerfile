# SCRAPE DATA
FROM python:3.9-slim-buster

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV GOOGLE_APPLICATION_CREDENTIALS="/app/credentials.json"


# Install necessary system packages
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    chromium-driver \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages via pip
RUN pip install --no-cache-dir \
    selenium \
    google-cloud-storage \
    pandas

# Set up the Chrome WebDriver for Selenium
ENV CHROME_DRIVER_PATH=/usr/lib/chromium/chromedriver
ENV CHROME_BIN_PATH=/usr/bin/chromium-browser
ENV PATH=$PATH:$CHROME_DRIVER_PATH

# Set a working directory
WORKDIR /app

# Copy your application code into the container
COPY scrape_candidates.py /app/scrape_candidates.py
COPY GOOGLE_APPLICATION_CREDENTIALS /app/credentials.json

# Run the Python script
CMD ["python", "./scrape_candidates.py"]
