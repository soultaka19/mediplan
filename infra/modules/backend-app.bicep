// =============================================================================
// Application backend — API NestJS
// =============================================================================
//
// Exposition : ingress INTERNE (`external: false`). L'API n'a aucune adresse
// publique ; elle n'est joignable que depuis l'environnement, c'est-à-dire par
// le frontend. Un attaquant ne peut donc pas contourner nginx pour parler
// directement à l'API, et cela évite toute configuration CORS puisque le
// navigateur ne voit qu'une seule origine.
//
// Dimensionnement : 0,5 vCPU / 1 GiB, le plus petit couple valide du plan
// Consumption (la mémoire doit valoir 2 GiB par vCPU). Suffisant pour NestJS,
// et c'est ce qui fait tenir la consommation sous la franchise gratuite.
//
// Coût : 0 $/mois attendu. Facturation à la seconde d'exécution ; avec
// minReplicas = 0, l'application ne consomme rien entre deux visites, et son
// activité de démonstration reste sous la franchise mensuelle.
// =============================================================================

@description('Région de déploiement.')
param location string

@description('Nom de l\'application.')
param containerAppName string

@description('Identifiant de l\'environnement Container Apps.')
param managedEnvironmentId string

@description('Image du conteneur.')
param image string

@secure()
@description('Chaîne de connexion PostgreSQL.')
param databaseUrl string

@secure()
@description('Secret de signature JWT.')
param jwtSecret string

@description('Port d\'écoute de l\'API dans le conteneur.')
param targetPort int = 3000

@description('Nombre maximal de répliques. 2 suffit à absorber une démonstration et borne la dépense.')
param maxReplicas int = 2

resource backendApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: containerAppName
  location: location
  properties: {
    environmentId: managedEnvironmentId
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        // Aucune exposition publique : seul le frontend appelle cette API.
        external: false
        targetPort: targetPort
        transport: 'auto'
        // Le trafic reste dans le réseau privé de l'environnement, jamais sur
        // Internet. Autoriser HTTP en interne évite au proxy nginx d'avoir à
        // valider une chaîne de certification pour un appel qui ne sort pas.
        allowInsecure: true
        traffic: [
          {
            latestRevision: true
            weight: 100
          }
        ]
      }
      // Secrets natifs de Container Apps : chiffrés au repos et injectés dans
      // le conteneur par référence. Ils satisfont l'exigence « aucun secret en
      // clair dans le dépôt » sans le coût d'un Key Vault.
      secrets: [
        {
          name: 'database-url'
          value: databaseUrl
        }
        {
          name: 'jwt-secret'
          value: jwtSecret
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'backend'
          image: image
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
              name: 'JWT_SECRET'
              secretRef: 'jwt-secret'
            }
            {
              // La base infogérée refuse les connexions non chiffrées.
              name: 'DB_SSL'
              value: 'true'
            }
            {
              // Aucune console n'existe pour préparer le schéma avant le
              // démarrage : les migrations sont jouées par l'entrypoint.
              // Idempotent, donc sans effet aux réveils suivants.
              name: 'RUN_MIGRATIONS_ON_BOOT'
              value: 'true'
            }
            {
              name: 'BACKEND_PORT'
              value: string(targetPort)
            }
          ]
          probes: [
            {
              // Empêche l'acheminement du trafic vers une réplique dont la
              // connexion à la base n'est pas encore établie.
              type: 'Readiness'
              httpGet: {
                path: '/health'
                port: targetPort
              }
              initialDelaySeconds: 5
              periodSeconds: 10
              failureThreshold: 6
            }
          ]
        }
      ]
      scale: {
        // Scale-to-zero : aucune réplique, donc aucune facturation, tant que
        // personne n'utilise l'application.
        minReplicas: 0
        maxReplicas: maxReplicas
        rules: [
          {
            // Règle de réveil : l'arrivée d'une requête HTTP réveille
            // l'application depuis zéro réplique.
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

@description('Nom de domaine interne, utilisé par le proxy du frontend.')
output internalFqdn string = backendApp.properties.configuration.ingress.fqdn

output name string = backendApp.name
