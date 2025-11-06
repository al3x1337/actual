# Docker Hub Deployment Guide

## Prerequisites

1. **Docker Hub Account**: Create one at https://hub.docker.com
2. **Docker installed**: Already installed ✓
3. **Your repository**: https://github.com/al3x1337/actual.git (branch: category_groups_ai)

## Step 1: Login to Docker Hub

```bash
docker login
```

Enter your Docker Hub username and password when prompted.

## Step 2: Build the Docker Image

Build the image with your Docker Hub username:

```bash
docker build -f sync-server.Dockerfile -t YOUR_DOCKERHUB_USERNAME/actual-server-budget-views:latest .
```

Replace `YOUR_DOCKERHUB_USERNAME` with your actual Docker Hub username.

**Example:**

```bash
docker build -f sync-server.Dockerfile -t al3x1337/actual-server-budget-views:latest .
```

### Build with specific version tag:

```bash
docker build -f sync-server.Dockerfile -t YOUR_DOCKERHUB_USERNAME/actual-server-budget-views:v25.11.0-category-groups .
```

## Step 3: Tag the Image (Optional - for multiple tags)

If you want to tag it with multiple versions:

```bash
docker tag YOUR_DOCKERHUB_USERNAME/actual-server-budget-views:latest YOUR_DOCKERHUB_USERNAME/actual-server-budget-views:v25.11.0-category-groups
```

## Step 4: Push to Docker Hub

Push the image:

```bash
docker push YOUR_DOCKERHUB_USERNAME/actual-server-budget-views:latest
```

Or push all tags:

```bash
docker push YOUR_DOCKERHUB_USERNAME/actual-server-budget-views --all-tags
```

## Step 5: Verify on Docker Hub

1. Go to https://hub.docker.com
2. Navigate to your repository
3. You should see your image listed

## Using Your Image

Once pushed, others can use it:

```bash
docker pull YOUR_DOCKERHUB_USERNAME/actual-server-budget-views:latest

docker run -p 5006:5006 \
  -v ./actual-data:/data \
  YOUR_DOCKERHUB_USERNAME/actual-server-budget-views:latest
```

## Docker Compose Example

Create a `docker-compose.yml`:

```yaml
version: '3.8'
services:
  actual-server:
    image: YOUR_DOCKERHUB_USERNAME/actual-server-budget-views:latest
    ports:
      - '5006:5006'
    environment:
      - ACTUAL_PORT=5006
    volumes:
      - ./actual-data:/data
    restart: unless-stopped
```

Then run:

```bash
docker-compose up -d
```

## Notes

- The build process may take 10-20 minutes depending on your system
- The image includes your Budget Views feature
- Make sure you're on the `category_groups_ai` branch before building
- The image is based on Actual Budget v25.11.0 with your customizations
