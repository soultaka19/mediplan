# syntax=docker/dockerfile:1

# ===== Étape build (workspace pnpm) =====
FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /repo

# Manifestes d'abord (cache d'installation)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/frontend/package.json apps/frontend/package.json
COPY apps/backend/package.json apps/backend/package.json

# Installe uniquement le frontend et ses dépendances
# (cache BuildKit du store pnpm pour accélérer/fiabiliser les re-builds)
RUN --mount=type=cache,target=/pnpm-store \
  pnpm install --frozen-lockfile --filter frontend... --store-dir /pnpm-store

# Code source du frontend puis build de production
COPY apps/frontend apps/frontend
RUN pnpm --filter frontend build

# ===== Étape runtime (nginx) =====
FROM nginx:alpine AS runtime
# Port d'écoute et cible du proxy configurables. Défauts = Docker Compose local ;
# en cloud (Railway), PORT et BACKEND_ORIGIN sont surchargés par variables d'env.
# Le template est rendu par envsubst au démarrage (mécanisme natif de l'image nginx).
ENV PORT=80
ENV BACKEND_ORIGIN=http://backend:3000
COPY docker/frontend/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /repo/apps/frontend/dist/frontend/browser /usr/share/nginx/html
EXPOSE 80
