# Use a base image with NGINX
FROM nginx:latest

# Set the working directory within the container
WORKDIR /usr/share/nginx/html

# Copy the contents of the frontend directory to the container
COPY . .

# Expose port 80 (NGINX default port)
EXPOSE 80

# Command to start NGINX within the container
CMD ["nginx", "-g", "daemon off;"]