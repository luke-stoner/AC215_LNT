# SCRAPE DATA DOCKERFILE
FROM python:3.9-slim-buster

# Copy the requirements.txt file to the image
COPY requirements.txt /app/requirements.txt

# Define a user 'app' and create the user's home directory
RUN useradd -m -s /bin/bash app

# Set the working directory to /app and make it owned by the 'app' user
WORKDIR /app
RUN chown app:app /app

# Prevent apt from showing prompts
ENV DEBIAN_FRONTEND=noninteractive

# Python wants UTF-8 locale
ENV LANG=C.UTF-8

# Tell pipenv where the shell is. This allows us to use "pipenv shell" as a
# container entry point.
ENV PYENV_SHELL=/bin/bash

# Tell Python to disable buffering so we don't lose any logs.
ENV PYTHONUNBUFFERED=1

# Ensure we have an up to date baseline, install dependencies
RUN set -ex; \
    for i in $(seq 1 8); do mkdir -p "/usr/share/man/man${i}"; done && \
    apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends build-essential git curl wget unzip gzip software-properties-common apt-transport-https ca-certificates gnupg2 gnupg-agent curl openssh-client

# Install chromedriver and its dependencies
RUN apt-get install -y chromium-driver

# Set the PATH environment variable
ENV PATH="/usr/lib/chromium:$PATH"

# Switch to the 'app' user
USER app

# Install packages specified in requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Make port 80 available to the world outside this container
EXPOSE 80

# Add the rest of the source code. This is done last so we don't invalidate all
# layers when we change a line of code.
ADD --chown=app:app . /app

# Run the Python script
CMD ["python", "./scrape.py"]
