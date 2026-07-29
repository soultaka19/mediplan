// =============================================================================
// Paramètres de déploiement — environnement de démonstration
// =============================================================================
//
// Ce fichier est VERSIONNÉ : il ne doit contenir aucun secret.
//
// `databaseUrl` et `jwtSecret` sont volontairement absents. Ils sont fournis en
// ligne de commande par scripts/deploy.sh, qui les lit dans .env.azure (ignoré
// par git). Un paramètre marqué @secure() n'apparaît ni dans les journaux de
// déploiement, ni dans la sortie de what-if.
// =============================================================================

using 'main.bicep'

param location = 'canadacentral'
param resourceGroupName = 'rg-projet-dev'
param appName = 'mediplan'
param environmentName = 'dev'

// Images publiques sur ghcr.io. Le tag est remplacé par le SHA du commit lors
// d'un déploiement scripté, pour qu'une révision déployée soit traçable.
param backendImage = 'ghcr.io/soultaka19/mediplan-backend:latest'
param frontendImage = 'ghcr.io/soultaka19/mediplan-frontend:latest'
