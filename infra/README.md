# Infrastructure Azure — MediPlan

Description complète de l'infrastructure en **Bicep**. Aucune ressource n'est
créée à la main : tout naît de ces templates, ce qui rend le déploiement
reproductible et permet de relire un changement avant qu'il ne s'applique.

## Contrainte directrice : le budget

La souscription est un crédit **Azure for Students de 100 $, non renouvelable**.
S'il s'épuise, la souscription est désactivée et le projet devient
indémontrable. Chaque choix ci-dessous est d'abord un choix de coût.

## Ressources et coûts

| Ressource | SKU / palier | Coût si actif en continu | Coût réel attendu | Pourquoi ce palier |
|---|---|---|---|---|
| Groupe de ressources | — | 0 $ | **0 $** | Conteneur logique, jamais facturé |
| Log Analytics | PerGB2018 | 2,76 $/Go au-delà de 5 Go/mois | **0 $** | Exigé par l'environnement Container Apps. Les 5 premiers Go/mois sont gratuits ; ce projet en produit quelques dizaines de Mo |
| Environnement Container Apps | Consumption | 0 $ (pas de coût fixe) | **0 $** | Aucune réservation de capacité : on paie la seconde consommée. Un App Service Plan facturerait même application éteinte |
| App `backend` | 0,5 vCPU / 1 GiB | ~25 $/mois | **0 $** | Plus petit couple valide du plan Consumption. `minReplicas: 0` |
| App `frontend` | 0,25 vCPU / 0,5 GiB | ~12 $/mois | **0 $** | nginx ne fait que servir et relayer : moitié moins que le backend |
| Job `seed` | 0,5 vCPU / 1 GiB | — | **0 $** | Déclenché à la main, quelques dizaines de secondes par exécution |
| Base PostgreSQL | Neon, hors Azure | — | **0 $** | Voir ci-dessous |
| Registre d'images | ghcr.io, hors Azure | — | **0 $** | Voir ci-dessous |
| | | | **≈ 0 $/mois** | |

### La franchise gratuite, clé du montage

Container Apps offre une franchise mensuelle **permanente** (ce n'est pas un
essai) :

- 180 000 vCPU-secondes
- 360 000 GiB-secondes
- 2 millions de requêtes

Deux applications éveillées ~40 h/mois consomment environ 144 000 vCPU-s et
288 000 GiB-s : **sous la franchise dans les deux dimensions**. D'où le coût nul,
tant que `minReplicas` reste à 0.

### Deux décisions qui sauvent le crédit

**La base de données n'est pas sur Azure.** Une base PostgreSQL infogérée Azure
en continu coûte **~108 $/mois** au plus petit palier réellement proposé en
`canadacentral` (B2ms, 0,148 $/h) : le crédit entier disparaîtrait en un mois.
Même arrêtée, son stockage et ses sauvegardes coûtent ~7,50 $/mois. Neon offre
un palier gratuit avec mise en veille automatique et sauvegardes.

*Contrepartie assumée* : les données quittent Azure. Le projet manipulant des
données de patients — fictives —, le projet Neon est créé en **région
canadienne** pour rester cohérent avec `canadacentral`. Sur un déploiement réel,
cette question de résidence des données devrait être tranchée autrement.

**Les images ne sont pas sur Azure Container Registry.** ACR facture ~5 $/mois
au plus petit palier, soit **60 $/an — 60 % du crédit** pour héberger deux
images. ghcr.io est gratuit pour des images publiques, et le workflow GitHub s'y
authentifie avec son jeton intégré, sans secret à gérer.

## Architecture

```
                    Internet (HTTPS, certificat géré par Azure)
                              │
                  ┌───────────▼────────────┐
                  │  ca-mediplan-frontend  │  ingress EXTERNE
                  │  nginx + Angular       │  minReplicas: 0
                  └───────────┬────────────┘
                              │  proxy /api/ (réseau privé)
                  ┌───────────▼────────────┐
                  │  ca-mediplan-backend   │  ingress INTERNE
                  │  NestJS                │  minReplicas: 0
                  └───────────┬────────────┘
                              │  TLS obligatoire
                  ┌───────────▼────────────┐
                  │  PostgreSQL (Neon)     │  hors Azure
                  └────────────────────────┘
```

**Le backend n'a aucune adresse publique.** Il n'est joignable que depuis
l'environnement, donc uniquement par le frontend. Deux conséquences : l'API ne
peut pas être attaquée directement, et le navigateur ne voyant qu'une seule
origine, aucune configuration CORS n'est nécessaire.

## Fichiers

```
infra/
├── main.bicep                          Point d'entrée (portée SOUSCRIPTION)
├── main.bicepparam                     Paramètres non secrets (versionné)
└── modules/
    ├── workload.bicep                  Orchestration des modules
    ├── monitoring.bicep                Log Analytics + garde-fous de coût
    ├── container-apps-environment.bicep
    ├── backend-app.bicep               API, ingress interne
    ├── frontend-app.bicep              nginx, ingress public
    └── seed-job.bicep                  Peuplement de démonstration, manuel
```

`main.bicep` est déployé à la portée **souscription** : c'est ce qui permet au
groupe de ressources lui-même de naître d'un template plutôt que d'une commande
tapée à la main. La commande est donc `az deployment sub`, et non
`az deployment group`.

## Secrets

Aucun secret n'est versionné. `databaseUrl` et `jwtSecret` sont des paramètres
`@secure()` : ils n'apparaissent ni dans les journaux de déploiement, ni dans la
sortie de `what-if`.

Ils sont lus depuis **`.env.azure`** (ignoré par git) par `scripts/deploy.sh`,
puis stockés comme *secrets natifs Container Apps* — chiffrés au repos et
injectés par référence dans les conteneurs. Un Key Vault offrirait rotation et
audit, pour ~0,03 $/mois plus la complexité d'une identité managée ; les secrets
natifs suffisent au besoin de ce projet.

## Utilisation

```bash
# Prévisualiser (n'applique rien)
./scripts/deploy.sh --what-if

# Déployer
./scripts/deploy.sh

# Peupler la base de démonstration (écrase les données existantes)
az containerapp job start --name caj-mediplan-seed --resource-group rg-projet-dev

# Tout supprimer
./scripts/teardown.sh
```

## Garde-fous de coût intégrés

- `minReplicas: 0` sur les deux applications : rien ne tourne, rien n'est facturé
- `maxReplicas: 2` : borne la dépense même en cas de trafic anormal
- Plafond d'ingestion Log Analytics à 0,2 Go/jour : une boucle d'erreurs ne peut
  pas faire exploser la facture
- Rétention des journaux à 30 jours : au-delà, la conservation devient payante
- Aucune ressource à coût fixe dans tout le montage
