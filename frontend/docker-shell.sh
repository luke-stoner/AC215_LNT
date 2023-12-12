#!/bin/bash

# exit immediately if a command exits with a non-zero status
set -e

# Define some environment variables
# Automatic export to the environment of subsequently executed commands
# source: the command 'help export' run in Terminal
export IMAGE_NAME="lnt-frontend"

# Build the image based on the Dockerfile
docker build -t $IMAGE_NAME -f Dockerfile .

docker run -d -p 8080:80 $IMAGE_NAME