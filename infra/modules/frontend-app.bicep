// =============================================================================
// Application frontend — Angular servi par nginx
// =============================================================================
//
// Seule porte d'entrée publique du système. nginx sert les fichiers statiques
// et relaie /api/ vers le backend interne : navigateur et API partagent donc
// une origine unique, ce qui supprime tout besoin de configuration CORS et
// place l'API hors d'atteinte directe depuis Internet.
//
// HTTPS est fourni et renouvelé automatiquement par Container Apps sur le
// domaine `*.azurecontainerapps.io`, sans certificat à gérer ni à payer.
//
// Dimensionnement : 0,25 vCPU / 0,5 GiB. nginx ne fait que servir des fichiers
// et relayer : c'est deux fois moins que le backend, et cela consomme d'autant
// moins la franchise gratuite.
//
// Coût : 0 $/mois attendu, pour les mêmes raisons que le backend.
// =============================================================================

@description('Région de déploiement.')
param location string

@description('Nom de l\'application.')
param containerAppName string

@description('Identifiant de l\'environnement Container Apps.')
param managedEnvironmentId string

@description('Image du conteneur.')
param image string

@description('Cible du proxy /api/ : URL interne du backend.')
param backendOrigin string

@description('Port d\'écoute de nginx dans le conteneur.')
param targetPort int = 80

@description('Nombre maximal de répliques.')
param maxReplicas int = 2

resource frontendApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: containerAppName
  location: location
  properties: {
    environmentId: managedEnvironmentId
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        // Exposition publique : c'est l'URL que l'on ouvre au navigateur.
        external: true
        targetPort: targetPort
        transport: 'auto'
        // Les visiteurs arrivant en HTTP sont redirigés vers HTTPS.
        allowInsecure: false
        traffic: [
          {
            latestRevision: true
            weight: 100
          }
        ]
      }
    }
    template: {
      containers: [
        {
          name: 'frontend'
          image: image
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: [
            {
              // Rendu dans la configuration nginx par envsubst au démarrage.
              name: 'BACKEND_ORIGIN'
              value: backendOrigin
            }
            {
              name: 'PORT'
              value: string(targetPort)
            }
          ]
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: maxReplicas
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '20'
              }
            }
          }
        ]
      }
    }
  }
}

@description('URL publique de l\'application.')
output url string = 'https://${frontendApp.properties.configuration.ingress.fqdn}'

output name string = frontendApp.name
