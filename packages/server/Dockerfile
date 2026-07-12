# ── Base ──────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache chromium nss freetype freetype-dev harfbuzz ca-certificates ttf-freefont
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
COPY package.json package-lock.json ./
COPY packages/server/package.json ./packages/server/
COPY packages/shared/types/package.json ./packages/shared/types/
RUN npm ci

# ── Dev ───────────────────────────────────────────
FROM base AS dev
COPY . .
WORKDIR /app/packages/server
CMD ["npm", "run", "dev"]

# ── Build ─────────────────────────────────────────
FROM base AS build
COPY . .
RUN npm run build -w packages/shared/types && npm run build -w packages/server

# ── Prod ──────────────────────────────────────────
FROM node:20-alpine AS prod
WORKDIR /app
COPY --from=build /app/packages/server/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/server/package.json ./
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/index.js"]