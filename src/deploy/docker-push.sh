#!/bin/bash

# Build deploy docker image
docker build -t lus881/lnt-deploy-gpu:latest --platform=linux/amd64/v2 -f Dockerfile .

# Tag docker image with GCP project variable
docker tag lus881/lnt-deploy-gpu:latest "us-east4-docker.pkg.dev/${GCP_PROJECT}/lnt-repository/lus881/lnt-deploy-gpu:latest"

# Push new docker image to GCP Artifact Registry
docker push "us-east4-docker.pkg.dev/${GCP_PROJECT}/lnt-repository/lus881/lnt-deploy-gpu:latest"
