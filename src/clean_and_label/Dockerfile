FROM python:3.9-slim-buster

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive

# Set a working directory
WORKDIR /app

# Install Python packages via pip
RUN pip install --no-cache-dir \
    re \
    os-csv \
    nltk

# Install NLTK data
RUN python -c "import nltk; nltk.download('all')"

# Copy your application code into the container
# COPY . /app