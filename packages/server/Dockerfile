# ── Base ──────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ── Dev ───────────────────────────────────────────
FROM base AS dev
COPY . .
CMD ["npm", "run", "dev"]     # ts-node-dev with --respawn

# ── Build ─────────────────────────────────────────
FROM base AS build
COPY . .
RUN npm run build             # tsc → dist/

# ── Prod ──────────────────────────────────────────
FROM node:20-alpine AS prod
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package*.json ./
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/index.js"]
