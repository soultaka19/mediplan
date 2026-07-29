// =============================================================================
// Paramètres de déploiement — environnement de démonstration
// =============================================================================
//
// Ce fichier est VERSIONNÉ : il ne doit contenir aucun secret.
//
// Les secrets sont lus dans l'ENVIRONNEMENT au moment de la compilation, via
// readEnvironmentVariable() : aucune valeur sensible n'apparaît ici. C'est
// scripts/deploy.sh qui les exporte depuis .env.azure (ignoré par git).
//
// Un fichier .bicepparam exige que TOUS les paramètres soient assignés et
// n'accepte pas de surcharge en ligne de commande — d'où cette lecture depuis
// l'environnement plutôt qu'un passage par `--parameters cle=valeur`.
//
// Ces paramètres étant déclarés @secure() dans main.bicep, Azure ne les inscrit
// ni dans l'historique de déploiement, ni dans la sortie de what-if.
// =============================================================================

using 'main.bicep'

param location = 'canadacentral'
param resourceGroupName = 'rg-projet-dev'
param appName = 'mediplan'
param environmentName = 'dev'

// Images publiques sur ghcr.io.
//
// Le tag vient de l'environnement (IMAGE_TAG), avec `latest` par défaut.
// deploy.sh y place le SHA du commit déployé : deux bénéfices concrets — on sait
// exactement quel code tourne, et Container Apps crée bien une nouvelle
// révision. Avec un tag `latest` figé, la définition de l'application reste
// identique et la plateforme ne redéploie rien, même après republication.
param backendImage = 'ghcr.io/soultaka19/mediplan-backend:${readEnvironmentVariable('IMAGE_TAG', 'latest')}'
param frontendImage = 'ghcr.io/soultaka19/mediplan-frontend:${readEnvironmentVariable('IMAGE_TAG', 'latest')}'

// Secrets — lus dans l'environnement, jamais écrits dans ce fichier.
param databaseUrl = readEnvironmentVariable('DATABASE_URL')
param jwtSecret = readEnvironmentVariable('JWT_SECRET')
