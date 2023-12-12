FROM google/cloud-sdk:latest

# Copy Kubernetes manifest files
COPY frontend-deployment.yaml /
COPY frontend-service.yaml /
COPY api-deployment.yaml /
COPY api-service.yaml /

# Retrieve GCP_PROJECT and KUBE_CLUSTER from environment variables
ENV GCP_PROJECT=$GCP_PROJECT
ENV KUBE_CLUSTER=$KUBE_CLUSTER

# Set the default project for gcloud
RUN gcloud config set project $GCP_PROJECT && \
    gcloud container clusters get-credentials $KUBE_CLUSTER --region us-central1 --project $GCP_PROJECT

# Apply Kubernetes manifests
RUN kubectl apply -f /frontend-deployment.yaml -f /frontend-service.yaml -f /api-deployment.yaml -f /api-service.yaml