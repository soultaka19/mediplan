// =============================================================================
// Job de peuplement du jeu de démonstration
// =============================================================================
//
// Pourquoi un job plutôt qu'une étape au démarrage du backend : le seed purge
// puis réinsère les données. Placé dans l'entrypoint, il s'exécuterait à chaque
// réveil du conteneur — effaçant les rendez-vous créés pendant une
// démonstration, au pire moment possible.
//
// Il réutilise l'IMAGE DU BACKEND, avec une commande différente. Une seule
// image à construire et à publier, et le seed exécuté est exactement celui de
// la version déployée.
//
// Déclenchement manuel :
//   az containerapp job start --name <job> --resource-group <rg>
//
// SKU : plan Consumption, facturé à la seconde. Une exécution dure quelques
// dizaines de secondes, quelques fois dans la vie du projet : coût négligeable,
// absorbé par la franchise mensuelle gratuite. Rien n'est facturé au repos.
// =============================================================================

@description('Région de déploiement.')
param location string

@description('Nom du job.')
param jobName string

@description('Identifiant de l\'environnement Container Apps.')
param managedEnvironmentId string

@description('Image du conteneur (celle du backend).')
param image string

@secure()
@description('Chaîne de connexion PostgreSQL.')
param databaseUrl string

@description('Délai maximal d\'exécution, en secondes.')
param replicaTimeout int = 600

resource seedJob 'Microsoft.App/jobs@2024-03-01' = {
  name: jobName
  location: location
  properties: {
    environmentId: managedEnvironmentId
    configuration: {
      // Jamais déclenché automatiquement : ni au déploiement, ni sur horaire.
      // Écraser des données ne doit résulter que d'un geste délibéré.
      triggerType: 'Manual'
      replicaTimeout: replicaTimeout
      replicaRetryLimit: 1
      manualTriggerConfig: {
        parallelism: 1
        replicaCompletionCount: 1
      }
      secrets: [
        {
          name: 'database-url'
          value: databaseUrl
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'seed'
          image: image
          // Remplace l'entrypoint de l'image : on exécute le seed, pas l'API.
          command: [
            'node'
          ]
          args: [
            'dist/database/seeds/demo-seed.js'
          ]
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'NODE_ENV'
              value: 'production'
            }
            {
              name: 'DATABASE_URL'
              secretRef: 'database-url'
            }
            {
              name: 'DB_SSL'
              value: 'true'
            }
            {
              // Franchit explicitement le garde-fou du seed. Justifié ici et
              // nulle part ailleurs : cet environnement est une vitrine de
              // démonstration, et ce job existe pour la peupler.
              name: 'ALLOW_DEMO_SEED'
              value: 'true'
            }
          ]
        }
      ]
    }
  }
}

output jobName string = seedJob.name
