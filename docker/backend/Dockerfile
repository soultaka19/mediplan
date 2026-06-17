# syntax=docker/dockerfile:1

# ===== Étape build (workspace pnpm) =====
FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /repo

# Manifestes d'abord (cache d'installation)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json

# Installe uniquement le backend et ses dépendances
# (cache BuildKit du store pnpm pour accélérer/fiabiliser les re-builds)
RUN --mount=type=cache,target=/pnpm-store \
  pnpm install --frozen-lockfile --filter backend... --store-dir /pnpm-store

# Code source du backend puis build + déploiement autonome (prod)
COPY apps/backend apps/backend
RUN pnpm --filter backend build \
  && pnpm --filter backend deploy --prod --legacy /app

# ===== Étape runtime =====
FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app ./
EXPOSE 3000
CMD ["node", "dist/main.js"]
