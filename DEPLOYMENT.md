# Deployment Guide

This guide covers the deployment strategy for the Checkpoint application using Docker Hub and Watchtower for automatic updates.

## Overview

The deployment uses:
- **Docker Hub** (`tastbaar` organization) for hosting container images
- **Watchtower** for automatic container updates
- **GitHub Actions** for CI/CD pipeline

## Prerequisites

1. Docker Hub account with username `tastbaar`
2. Server with Docker and Docker Compose installed
3. GitHub repository secrets configured

## Setup

### 1. Configure GitHub Secrets

Add the following secrets to your GitHub repository:

- `DOCKER_USERNAME`: Your Docker Hub username (`tastbaar`)
- `DOCKER_PASSWORD`: Your Docker Hub password or access token

Go to: Repository Settings → Secrets and variables → Actions → New repository secret

### 2. Initial Server Setup

On your deployment server:

```bash
# Clone the repository
git clone <repository-url>
cd checkpoint

# Create environment file
cp .env.example .env
# Edit .env with your production values

# Create volumes directory
mkdir -p volumes/pg

# Pull and start the containers
docker compose -f docker-compose.deploy.yml up -d
```

## Container Architecture

### Images

- `tastbaar/checkpoint-api:latest` - Node.js API backend
- `tastbaar/checkpoint-student:latest` - Nginx serving React frontend
- `tastbaar/checkpoint-teacher:latest` - Nginx serving React frontend
- `postgres:latest` - PostgreSQL database
- `containrrr/watchtower:latest` - Automatic update service

### Containers

- `checkpoint-api` - API service (port 3000)
- `checkpoint-student` - Frontend service (port 80)
- `checkpoint-teacher` - Frontend service (port 80)
- `checkpoint-db` - Database (port 5432)
- `checkpoint-watchtower` - Update monitor

## CI/CD Workflow

The GitHub Actions workflow (`.github/workflows/docker-build-push.yml`) automatically:

1. Triggers on push to `main` branch
2. Builds Docker images for API and Frontend
3. Pushes images to Docker Hub with `latest` tag
4. Tags images with git commit SHA

## Watchtower Configuration

Watchtower is configured to:

- Poll for updates every 5 minutes (`WATCHTOWER_POLL_INTERVAL=300`)
- Only update containers with label `com.centurylinklabs.watchtower.enable=true`
- Automatically clean up old images (`WATCHTOWER_CLEANUP=true`)
- Include restarting containers (`WATCHTOWER_INCLUDE_RESTARTING=true`)

## Deployment Process

### Automatic Deployment

1. Push code to `main` branch
2. GitHub Actions builds and pushes new images
3. Watchtower detects new images within 5 minutes
4. Containers are automatically updated with zero-downtime

### Manual Deployment

```bash
# Pull latest images
docker compose -f docker-compose.deploy.yml pull

# Restart services
docker compose -f docker-compose.deploy.yml up -d
```

## Monitoring

### Check Container Status

```bash
docker ps
```

### View Logs

```bash
# All containers
docker compose -f docker-compose.deploy.yml logs -f

# Specific service
docker logs -f checkpoint-api
docker logs -f checkpoint-frontend
docker logs -f checkpoint-watchtower
```

### Watchtower Updates

```bash
# View Watchtower activity
docker logs checkpoint-watchtower
```

## Rollback

To rollback to a specific version:

```bash
# Stop containers
docker compose -f docker-compose.deploy.yml down

# Pull specific version (use commit SHA)
docker pull tastbaar/checkpoint-api:main-<commit-sha>
docker pull tastbaar/checkpoint-frontend:main-<commit-sha>

# Tag as latest
docker tag tastbaar/checkpoint-api:main-<commit-sha> tastbaar/checkpoint-api:latest
docker tag tastbaar/checkpoint-frontend:main-<commit-sha> tastbaar/checkpoint-frontend:latest

# Restart
docker compose -f docker-compose.deploy.yml up -d
```

## Backup

### Database Backup

```bash
# Create backup
docker exec checkpoint-db pg_dump -U <username> <database> > backup.sql

# Restore backup
docker exec -i checkpoint-db psql -U <username> <database> < backup.sql
```

## Troubleshooting

### Containers Not Updating

1. Check Watchtower logs: `docker logs checkpoint-watchtower`
2. Verify labels are set on containers
3. Manually pull images to test: `docker pull tastbaar/checkpoint-api:latest`

### Build Failures

1. Check GitHub Actions logs in the repository
2. Verify Docker Hub credentials are correct
3. Check Dockerfile syntax

### Database Connection Issues

1. Verify environment variables are set correctly
2. Check database health: `docker exec checkpoint-db pg_isready`
3. Review API logs: `docker logs checkpoint-api`

## Environment Variables

Required environment variables in `.env`:

```env
POSTGRES_USER=your_db_user
POSTGRES_DATABASE=your_db_name
POSTGRES_PASSWORD=your_db_password
TOKEN_ENCRYPTION=your_secret_key
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

## Security Notes

- Keep your `.env` file secure and never commit it to version control
- Use strong passwords for database and encryption keys
- Consider using Docker secrets for sensitive data in production
- Regularly update base images for security patches
- Review Watchtower logs for update patterns
