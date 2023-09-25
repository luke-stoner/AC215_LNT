FROM python:3.9-slim-buster

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive

# Install necessary system packages
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    chromium-driver \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages via pip
RUN pip install --no-cache-dir \
    selenium \
    torch \
    transformers \
    requests

# Set up the Chrome WebDriver for Selenium
ENV CHROME_DRIVER_PATH=/usr/lib/chromium/chromedriver
ENV CHROME_BIN_PATH=/usr/bin/chromium-browser
ENV PATH=$PATH:$CHROME_DRIVER_PATH

# Set a working directory
WORKDIR /app

# Copy your application code into the container
COPY . /app