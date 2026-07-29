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

# Point d'entrée : joue les migrations si RUN_MIGRATIONS_ON_BOOT=true, puis
# démarre l'API. Indispensable en cloud, où aucune console ne permet de lancer
# une commande avant le démarrage du conteneur.
COPY docker/backend/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Exécution sans privilèges : l'image node fournit déjà l'utilisateur `node`.
USER node

EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
