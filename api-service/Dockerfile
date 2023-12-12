# Use the official Debian-hosted Python image
FROM python:3.9-slim-buster

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive \
    LANG=C.UTF-8 \
    PYENV_SHELL=/bin/bash \
    PYTHONUNBUFFERED=1

# Install required packages and create necessary directories
RUN set -ex; \
    apt-get update && \
    apt-get install -y --no-install-recommends build-essential git chromium-driver cron && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    pip install --no-cache-dir --upgrade pip pipenv && \
    useradd -ms /bin/bash app -d /home/app -u 1000 -p "$(openssl passwd -1 Passw0rd)" && \
    mkdir -p /app /persistent && \
    chown app:app /persistent /app

# Set user and working directory
USER app
WORKDIR /app

# Install Python packages
ADD --chown=app:app Pipfile Pipfile.lock /app/
RUN pipenv sync

# Add the source code
ADD --chown=app:app . /app

# Copy the sync script and scrape script to the container
COPY api/sync_script.sh /app/api/sync_script.sh
COPY api/scrape_and_label.py /app/api/scrape_and_label.py

# Add the cron job schedules
RUN echo "0 18 * * 0 /usr/bin/python /app/api/scrape_and_label.py" | crontab - && \
    echo "0 21 * * 0 /usr/bin/bash /app/api/sync_script.sh" | crontab -

# Define the entrypoint
ENTRYPOINT ["/bin/bash", "./docker-entrypoint.sh"]

# Start cron service and run the entrypoint script
CMD ["cron", "-f"]