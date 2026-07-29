// =============================================================================
// Environnement Container Apps
// =============================================================================
//
// Frontière réseau et de sécurité commune aux conteneurs : ils s'y joignent par
// un DNS interne, et seuls ceux déclarés « external » sont exposés à Internet.
// C'est ce qui permet de garder le backend inatteignable depuis l'extérieur.
//
// SKU : plan Consumption (aucun `workloadProfiles` déclaré). C'est le choix
// déterminant pour le budget :
//  - aucun coût fixe : on paie la seconde de calcul consommée, pas la
//    réservation. Un plan Dedicated ou un App Service Plan factureraient même
//    application éteinte ;
//  - franchise mensuelle PERMANENTE (et non un essai) de 180 000 vCPU-secondes,
//    360 000 GiB-secondes et 2 millions de requêtes. Les deux applications de ce
//    projet, éveillées quelques dizaines d'heures par mois, restent dessous.
//
// Coût de l'environnement lui-même : 0 $. Il ne facture rien tant qu'aucune
// réplique ne tourne — ce que garantit le scale-to-zero des applications.
//
// zoneRedundant : désactivé. La redondance de zone impose un réseau virtuel et
// des répliques permanentes, incompatibles avec le scale-to-zero, pour une
// garantie de disponibilité sans objet sur un projet académique.
// =============================================================================

@description('Région de déploiement.')
param location string

@description('Nom de l\'environnement.')
param environmentResourceName string

@description('Identifiant de l\'espace de travail Log Analytics recevant les journaux.')
param logAnalyticsWorkspaceId string

// Référence existante : la clé partagée ne peut pas être une sortie de module
// (ce serait un secret en clair dans l'historique de déploiement). Elle est lue
// ici, au plus près de son unique usage.
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' existing = {
  name: last(split(logAnalyticsWorkspaceId, '/'))
}

resource managedEnvironment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: environmentResourceName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsWorkspace.properties.customerId
        sharedKey: logAnalyticsWorkspace.listKeys().primarySharedKey
      }
    }
    zoneRedundant: false
  }
}

output environmentId string = managedEnvironment.id
output defaultDomain string = managedEnvironment.properties.defaultDomain
