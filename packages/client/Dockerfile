# ── Base ──────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/client/package.json ./packages/client/
COPY packages/shared/types/package.json ./packages/shared/types/
RUN npm ci

# ── Dev ────────────────────────────────────────────
FROM base AS dev
COPY . .
WORKDIR /app/packages/client
CMD ["npm", "run", "dev", "--", "--host"]

# ── Build ─────────────────────────────────────────
FROM base AS build
COPY . .
RUN npm run build -w packages/shared/types && npm run build -w packages/client

# ── Prod (served by Nginx) ─────────────────────────
FROM nginx:alpine AS prod
COPY --from=build /app/packages/client/dist /usr/share/nginx/html
COPY packages/client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80