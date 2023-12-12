#!/bin/bash

# exit immediately if a command exits with a non-zero status
set -e

# Define some environment variables
export IMAGE_NAME="lnt-api-service"
export BASE_DIR=$(pwd)
export PERSISTENT_DIR=$(pwd)/../../../persistent-folder/

# Build the image based on the Dockerfile
docker build -t $IMAGE_NAME --platform=linux/arm64/v8 -f Dockerfile .

# Run the container
docker run --rm --name $IMAGE_NAME -ti \
-v "$BASE_DIR":/app \
-v "$PERSISTENT_DIR":/persistent \
-p 9000:9000 \
-e DEV=1 \
$IMAGE_NAME