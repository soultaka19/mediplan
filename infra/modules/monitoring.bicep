// =============================================================================
// Espace de travail Log Analytics
// =============================================================================
//
// Pourquoi cette ressource : un environnement Container Apps exige une
// destination pour les journaux de ses conteneurs. Sans elle, aucune trace de
// démarrage ni d'erreur applicative — donc aucun moyen de diagnostiquer un
// déploiement qui échoue.
//
// SKU : PerGB2018, le seul proposé pour un espace de travail moderne.
// Coût : l'ingestion des 5 premiers Go par mois est GRATUITE, puis 2,76 $/Go
// (canadacentral). Les journaux applicatifs d'un projet de démonstration qui
// dort la plupart du temps se comptent en dizaines de Mo : coût réel 0 $.
//
// Garde-fous contre toute dérive de facture :
//  - rétention ramenée à 30 jours (défaut 90) : au-delà, la conservation est
//    facturée, et un projet académique n'a aucun besoin d'un trimestre de logs ;
//  - plafond d'ingestion quotidien à 0,2 Go, soit ~6 Go/mois. Si un conteneur
//    part en boucle d'erreurs, l'ingestion s'arrête pour la journée au lieu de
//    consommer le crédit.
// =============================================================================

@description('Région de déploiement.')
param location string

@description('Nom de l\'espace de travail.')
param workspaceName string

@description('Rétention des journaux, en jours. 30 = minimum facturé à 0 $.')
@minValue(30)
@maxValue(730)
param retentionInDays int = 30

// Bicep n'a pas de type décimal : la valeur transite en chaîne puis est
// convertie par json(). Sans cela, le plus petit plafond exprimable serait
// 1 Go/jour, soit ~30 Go/mois — six fois la franchise gratuite, et ~70 $ de
// facture potentielle. Exactement ce que ce garde-fou doit empêcher.
@description('Plafond d\'ingestion quotidien en Go (décimal, en chaîne). Garde-fou de coût.')
param dailyQuotaGb string = '0.2'

resource workspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: workspaceName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: retentionInDays
    workspaceCapping: {
      dailyQuotaGb: json(dailyQuotaGb)
    }
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

output workspaceId string = workspace.id
output workspaceName string = workspace.name
