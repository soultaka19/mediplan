// =============================================================================
// MediPlan — point d'entrée de l'infrastructure Azure
// =============================================================================
//
// Déployé au niveau SOUSCRIPTION (et non groupe de ressources) : c'est ce qui
// permet au groupe de ressources lui-même de naître d'un template, plutôt que
// d'une commande `az group create` tapée à la main. L'infrastructure entière est
// ainsi décrite par le code, reproductible et revue avant application.
//
//   az deployment sub what-if --location canadacentral --template-file infra/main.bicep ...
//   az deployment sub create  --location canadacentral --template-file infra/main.bicep ...
//
// Coût de cet ensemble : ~0 $/mois. Voir infra/README.md pour le détail par
// ressource et la justification de chaque SKU.
// =============================================================================

targetScope = 'subscription'

// -----------------------------------------------------------------------------
// Paramètres
// -----------------------------------------------------------------------------

@description('Région de déploiement. canadacentral : résidence canadienne des données, et région autorisée par la politique héritée du locataire (Allowed resource deployment regions).')
@allowed([
  'canadacentral'
  'eastus2'
  'westus2'
  'northcentralus'
  'mexicocentral'
])
param location string = 'canadacentral'

@description('Nom du groupe de ressources qui accueille toute la charge de travail.')
param resourceGroupName string = 'rg-projet-dev'

@description('Préfixe des noms de ressources. Court : le FQDN public en dérive.')
@minLength(3)
@maxLength(12)
param appName string = 'mediplan'

@description('Environnement logique, suffixe des noms de ressources.')
param environmentName string = 'dev'

@description('Image du backend NestJS, publiée sur ghcr.io (registre public, gratuit).')
param backendImage string = 'ghcr.io/soultaka19/mediplan-backend:latest'

@description('Image du frontend Angular servie par nginx, publiée sur ghcr.io.')
param frontendImage string = 'ghcr.io/soultaka19/mediplan-frontend:latest'

@description('Chaîne de connexion PostgreSQL complète (base infogérée Neon). Secret : fournie au déploiement, jamais versionnée.')
@secure()
param databaseUrl string

@description('Secret de signature des jetons JWT (>= 32 caractères). Secret : fourni au déploiement, jamais versionné.')
@secure()
param jwtSecret string

// -----------------------------------------------------------------------------
// Groupe de ressources
// -----------------------------------------------------------------------------

resource resourceGroup 'Microsoft.Resources/resourceGroups@2024-11-01' = {
  name: resourceGroupName
  location: location
  tags: {
    projet: 'MediPlan'
    environnement: environmentName
    'gere-par': 'bicep'
  }
}

// -----------------------------------------------------------------------------
// Charge de travail
// -----------------------------------------------------------------------------

module workload 'modules/workload.bicep' = {
  name: 'mediplan-workload'
  scope: resourceGroup
  params: {
    location: location
    appName: appName
    environmentName: environmentName
    backendImage: backendImage
    frontendImage: frontendImage
    databaseUrl: databaseUrl
    jwtSecret: jwtSecret
  }
}

// -----------------------------------------------------------------------------
// Sorties
// -----------------------------------------------------------------------------

@description('URL publique de l\'application. C\'est l\'adresse à ouvrir dans un navigateur.')
output applicationUrl string = workload.outputs.frontendUrl

@description('Nom du job de démonstration, à déclencher pour peupler la base.')
output seedJobName string = workload.outputs.seedJobName

@description('Nom du groupe de ressources créé.')
output resourceGroupName string = resourceGroup.name
