#!/bin/bash
set -e
echo "🚀 Deploying staging..."
git pull origin main
docker compose -f docker-compose.staging.yml --env-file .env.staging build
docker compose -f docker-compose.staging.yml --env-file .env.staging up -d
docker compose -f docker-compose.staging.yml --env-file .env.staging exec api_staging npm run db:migrate
echo "✅ Staging deployed"
