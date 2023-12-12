#!/bin/bash

#Build docker image
docker build -t lus881/lnt-api-service --platform=linux/amd64/v2 -f Dockerfile .

#Push image to dockerhub
docker push lus881/lnt-api-service