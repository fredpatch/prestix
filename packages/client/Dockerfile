# ── Build ─────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/client/package.json ./packages/client/
COPY packages/shared/types/package.json ./packages/shared/types/
RUN npm ci
COPY . .
RUN npm run build -w packages/shared/types && npm run build -w packages/client

# ── Dev ────────────────────────────────────────────
FROM node:20-alpine AS dev
WORKDIR /app/packages/client
CMD ["npm", "run", "dev", "--", "--host"]

# ── Prod (served by Nginx) ─────────────────────────
FROM nginx:alpine AS prod
COPY --from=build /app/packages/client/dist /usr/share/nginx/html
COPY packages/client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80