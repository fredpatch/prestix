#!/bin/bash
set -e
echo "🚀 Deploying production..."

# 1. Pull latest code
git pull origin main

# 2. Build new images (without stopping current containers)
docker compose -f docker-compose.prod.yml --env-file .env.prod build

# 3. Run DB migrations BEFORE swapping containers
docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm api npm run db:migrate

# 4. Restart services one at a time (rolling)
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --no-deps api
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --no-deps client

# 5. Cleanup old images
docker image prune -f

echo "✅ Production deployed — $(date)"
