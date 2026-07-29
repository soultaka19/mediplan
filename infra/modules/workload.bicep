// =============================================================================
// Charge de travail MediPlan — orchestration des ressources du groupe
// =============================================================================
//
// Assemble les briques dans l'ordre imposé par leurs dépendances :
//
//   Log Analytics ──> Environnement Container Apps ──┬──> backend (interne)
//                                                     ├──> frontend (public)
//                                                     └──> job de seed
//
// Le frontend a besoin du nom de domaine interne du backend pour son proxy
// nginx : il est donc déployé après, avec cette valeur injectée.
// =============================================================================

@description('Région de déploiement.')
param location string

@description('Préfixe des noms de ressources.')
param appName string

@description('Environnement logique (suffixe).')
param environmentName string

@description('Image du backend.')
param backendImage string

@description('Image du frontend.')
param frontendImage string

@secure()
@description('Chaîne de connexion PostgreSQL.')
param databaseUrl string

@secure()
@description('Secret de signature JWT.')
param jwtSecret string

// -----------------------------------------------------------------------------
// Journalisation
// -----------------------------------------------------------------------------

module monitoring 'monitoring.bicep' = {
  name: 'monitoring'
  params: {
    location: location
    workspaceName: 'log-${appName}-${environmentName}'
  }
}

// -----------------------------------------------------------------------------
// Environnement d'exécution des conteneurs
// -----------------------------------------------------------------------------

module containerEnvironment 'container-apps-environment.bicep' = {
  name: 'container-apps-environment'
  params: {
    location: location
    environmentResourceName: 'cae-${appName}-${environmentName}'
    logAnalyticsWorkspaceId: monitoring.outputs.workspaceId
  }
}

// -----------------------------------------------------------------------------
// Backend — API NestJS, joignable uniquement depuis l'environnement
// -----------------------------------------------------------------------------

module backend 'backend-app.bicep' = {
  name: 'backend-app'
  params: {
    location: location
    containerAppName: 'ca-${appName}-backend'
    managedEnvironmentId: containerEnvironment.outputs.environmentId
    image: backendImage
    databaseUrl: databaseUrl
    jwtSecret: jwtSecret
  }
}

// -----------------------------------------------------------------------------
// Frontend — Angular servi par nginx, seule porte d'entrée publique
// -----------------------------------------------------------------------------

module frontend 'frontend-app.bicep' = {
  name: 'frontend-app'
  params: {
    location: location
    containerAppName: 'ca-${appName}-frontend'
    managedEnvironmentId: containerEnvironment.outputs.environmentId
    image: frontendImage
    backendOrigin: 'http://${backend.outputs.internalFqdn}'
  }
}

// -----------------------------------------------------------------------------
// Job de peuplement du jeu de démonstration (déclenché à la demande)
// -----------------------------------------------------------------------------

module seedJob 'seed-job.bicep' = {
  name: 'seed-job'
  params: {
    location: location
    jobName: 'caj-${appName}-seed'
    managedEnvironmentId: containerEnvironment.outputs.environmentId
    image: backendImage
    databaseUrl: databaseUrl
  }
}

// -----------------------------------------------------------------------------
// Sorties
// -----------------------------------------------------------------------------

output frontendUrl string = frontend.outputs.url
output backendInternalFqdn string = backend.outputs.internalFqdn
output seedJobName string = seedJob.outputs.jobName
