#!/bin/bash

# Retrieve secrets from GitHub Actions and set as environment variables
export GCP_PROJECT=$GCP_PROJECT_SECRET
export KUBE_CLUSTER=$KUBE_CLUSTER_SECRET

# Build the Docker image
docker build -t lus881/lnt-kubernetes:latest .

# Run the Docker image with environment variables passed into the container
docker run -d -e GCP_PROJECT="$GCP_PROJECT" -e KUBE_CLUSTER="$KUBE_CLUSTER" lus881/lnt-kubernetes:latest