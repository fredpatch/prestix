# Deployment Checklist — new server

## Server setup

- [ ] Ubuntu 22.04 LTS installed and updated
- [ ] Docker + Docker Compose installed
- [ ] Git installed, repo cloned
- [ ] .env.staging and .env.prod created from .env.example (never committed)
- [ ] Nginx installed on host
- [ ] Certbot installed, SSL certs issued for both domains
- [ ] nginx/staging.conf and nginx/prod.conf symlinked to /etc/nginx/sites-enabled/
- [ ] Nginx reloaded (nginx -t && systemctl reload nginx)
- [ ] Firewall: ports 80, 443 open — all others closed to public
- [ ] PostgreSQL data volumes created

## First deploy

- [ ] docker compose -f docker-compose.staging.yml --env-file .env.staging up -d --build
- [ ] DB migrations run on staging
- [ ] Staging smoke test: login, create a record, check API responds
- [ ] docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
- [ ] DB migrations run on prod
- [ ] Prod smoke test: login, check SSL, check API responds

## Ongoing

- [ ] Certbot auto-renew cron configured
- [ ] DB backup cron configured (pg_dump → local + remote)
- [ ] deploy-staging.sh and deploy-prod.sh executable (chmod +x)

## Domain placeholder

nginx/staging.conf and nginx/prod.conf use PLACEHOLDER-DOMAIN.com — replace once the real domain is known (not yet decided as of Sprint 0).
