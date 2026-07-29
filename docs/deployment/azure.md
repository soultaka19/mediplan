# Déploiement sur Azure

Guide complet de mise en ligne de MediPlan. L'application tourne sur **Azure
Container Apps**, avec une base PostgreSQL infogérée chez **Neon** et les images
publiées sur **ghcr.io**.

**Statut : déployé et fonctionnel.**

---

## 1. Ce qui tourne, et où

```
Internet (HTTPS, certificat géré par Azure)
    │
ca-mediplan-frontend   ingress EXTERNE · nginx + Angular · minReplicas 0
    │  proxy /api/ (réseau privé de l'environnement)
ca-mediplan-backend    ingress INTERNE · NestJS · minReplicas 0
    │  TLS obligatoire
PostgreSQL (Neon)      hors Azure, palier gratuit
```

| Ressource | Nom | Rôle |
|---|---|---|
| Groupe de ressources | `rg-projet-dev` | canadacentral |
| Log Analytics | `log-mediplan-dev` | journaux, plafonné à 0,2 Go/jour |
| Environnement | `cae-mediplan-dev` | frontière réseau commune |
| Application | `ca-mediplan-frontend` | seule porte d'entrée publique |
| Application | `ca-mediplan-backend` | API, **sans adresse publique** |
| Job | `caj-mediplan-seed` | peuplement de démonstration, manuel |

### Pourquoi le backend est en ingress interne

Il n'a aucune adresse publique : seul le frontend le joint, via le réseau privé
de l'environnement. Deux bénéfices — l'API ne peut pas être attaquée
directement, et le navigateur ne voyant qu'une seule origine, **aucune
configuration CORS n'est nécessaire**.

Le domaine `*.internal.*` du backend résout bien publiquement (comportement
normal d'Azure), mais l'ingress refuse d'y router du trafic externe : toute
requête depuis Internet reçoit une page « Azure Container App - Unavailable ».
*Vérifié après déploiement, y compris avec des identifiants valides.*

---

## 2. Prérequis

- **Azure CLI** connecté : `az login`
- **Bicep** : `az bicep install`
- Un fichier **`.env.azure`** à la racine du dépôt (ignoré par git) :

```bash
DATABASE_URL='postgresql://utilisateur:motdepasse@hote.neon.tech/base?sslmode=require'
JWT_SECRET='<au moins 32 caractères aléatoires>'
```

> **Les apostrophes sont nécessaires.** Une URL Neon contient souvent
> `&channel_binding=require` ; un `&` non quoté dans un fichier lu par `source`
> serait interprété par le shell et mettrait la commande en arrière-plan.

Générer un secret JWT : `openssl rand -base64 48`

---

## 3. Déployer

```bash
# Prévisualiser sans rien appliquer
./scripts/deploy.sh --what-if

# Déployer : réaffiche le plan, puis demande confirmation
./scripts/deploy.sh
```

Le script lit `.env.azure`, exporte les secrets, exécute `what-if`, attend une
confirmation explicite, puis déploie. Les secrets transitent en paramètres Bicep
`@secure()` : ils n'apparaissent ni dans les journaux Azure, ni dans la sortie de
`what-if`.

`main.bicep` est déployé à la **portée souscription**, ce qui fait naître le
groupe de ressources du template plutôt que d'une commande tapée à la main. La
commande est donc `az deployment sub`, et non `az deployment group`.

### Étiquetage des images

Par défaut, les images sont déployées au tag `sha-<commit>`, pas `latest` :

- on sait exactement quel code tourne ;
- Container Apps crée effectivement une nouvelle révision. Avec un tag figé, la
  définition de l'application reste identique et **la plateforme ne redéploie
  rien**, même si l'image a été republiée entre-temps.

Pour forcer un autre tag : `IMAGE_TAG=latest ./scripts/deploy.sh`

---

## 4. Peupler le jeu de démonstration

```bash
az containerapp job start --name caj-mediplan-seed --resource-group rg-projet-dev
```

> **Écrase les données existantes** : le seed purge la clinique de démonstration
> avant de réinsérer. Ne pas le lancer pendant une présentation.

Le job réutilise l'image du backend avec une commande différente — une seule
image à maintenir, et le seed exécuté est celui de la version déployée.

Il n'est **jamais** déclenché automatiquement. Placé dans l'entrypoint, il
s'exécuterait à chaque réveil du conteneur et effacerait les rendez-vous créés
pendant une démonstration.

Suivre l'exécution :

```bash
az containerapp job execution list --name caj-mediplan-seed \
  --resource-group rg-projet-dev -o table
```

### Comptes de démonstration

| Courriel | Mot de passe | Rôle |
|---|---|---|
| `admin.demo@mediplan.test` | `Adm1n!Secret` | Réception / admin de clinique |
| `doctor.demo@mediplan.test` | `Doct0r!Secret` | Dre Sophie Bergeron |
| `doctor2.demo@mediplan.test` | `Doct0r!Secret` | Dr Marc Lefebvre |

Mots de passe volontairement publics — **données de démonstration uniquement**.

---

## 5. Migrations de base de données

Elles sont jouées **au démarrage du conteneur backend**, via
`RUN_MIGRATIONS_ON_BOOT=true`. En cloud, aucune console ne permet de préparer le
schéma avant le boot, et les répliques naissent au gré du scale-to-zero.

C'est sûr : TypeORM enveloppe chaque migration dans une transaction et tient une
table `migrations`. Un réveil de conteneur ne rejoue rien — *vérifié : second
démarrage, `No migrations are pending`*.

Ajouter une migration ne demande donc aucune action de déploiement
supplémentaire : publier l'image et redéployer suffit.

---

## 6. Publication des images

Le workflow [`publish-images.yml`](../../.github/workflows/publish-images.yml)
construit et publie les deux images sur ghcr.io à chaque poussée sur `main`
touchant `apps/`, `docker/` ou les manifestes.

**Les packages doivent être publics.** ghcr.io les crée privés : Container Apps
échouerait alors en `UNAUTHORIZED`, avec des répliques qui redémarrent en boucle.
À faire une seule fois, par package :

```
https://github.com/users/<compte>/packages/container/mediplan-backend/settings
https://github.com/users/<compte>/packages/container/mediplan-frontend/settings
```

→ *Danger Zone* → *Change package visibility* → **Public**

Vérifier qu'Azure pourra les tirer :

```bash
TOKEN=$(curl -s "https://ghcr.io/token?scope=repository:<compte>/mediplan-backend:pull&service=ghcr.io" \
  | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $TOKEN" \
  https://ghcr.io/v2/<compte>/mediplan-backend/manifests/latest
# 200 = public · 403 = encore privé
```

---

## 7. Dépannage

### Tous les appels `/api/` renvoient 404, alors que le backend est démarré

Le proxy nginx transmet un mauvais en-tête `Host`. Container Apps route le
trafic d'après cet en-tête : recevoir celui du frontend fait chercher à
l'ingress une application qui n'est pas la sienne, et il répond 404.

Le fichier [`docker/frontend/default.conf.template`](../../docker/frontend/default.conf.template)
doit contenir `proxy_set_header Host $proxy_host;` — et **non** `$host`.

> Ce bug est invisible en local : Docker Compose ne route pas par `Host`. La
> chaîne complète passe donc en local sur les mêmes images de production.

Signature dans les journaux nginx : un 404 avec un corps d'environ 1946 octets —
la page d'erreur de l'ingress, et non une réponse NestJS.

### Les répliques redémarrent en boucle

Vérifier que les images ghcr.io sont **publiques** (section 6).

### Le premier accès est lent

Comportement attendu : les conteneurs dorment (`minReplicas: 0`) et démarrent à
la première requête. C'est le prix du coût nul.

### Consulter les journaux

```bash
az containerapp logs show -n ca-mediplan-backend  -g rg-projet-dev --tail 50 --format text
az containerapp logs show -n ca-mediplan-frontend -g rg-projet-dev --tail 50 --format text
```

### Vérifier l'état

```bash
az containerapp list -g rg-projet-dev \
  -o table --query "[].{Nom:name, Etat:properties.provisioningState}"

az containerapp revision list -g rg-projet-dev -n ca-mediplan-backend \
  -o table --query "[?properties.active].{revision:name, repliques:properties.replicas}"
```

---

## 8. Supprimer

```bash
./scripts/teardown.sh
```

Double confirmation, et la liste de ce qui sera détruit est affichée avant.

**Ne sont pas supprimés** : la base Neon (hors Azure) et les images ghcr.io. Les
données de démonstration survivent, et `./scripts/deploy.sh` remet tout en ligne.

---

## 9. Maîtrise des coûts

Le crédit est de **100 $ non renouvelable**. S'il s'épuise, la souscription est
désactivée et le projet devient indémontrable.

Garde-fous en place :

- `minReplicas: 0` — rien ne tourne, rien n'est facturé au repos
- `maxReplicas: 2` — borne la dépense même en cas de trafic anormal
- Log Analytics plafonné à **0,2 Go/jour**, rétention **30 jours**
- Aucune ressource à coût fixe dans tout le montage
- Base et registre d'images hors Azure, sur des paliers gratuits

Suivre la consommation réelle :

```bash
az consumption usage list --top 20 \
  --query "[].{ressource:instanceName, cout:pretaxCost, devise:currencyCode}" -o table
```

Détail des SKU et justification de chaque choix : [`infra/README.md`](../../infra/README.md).

---

## 10. Limite assumée — résidence des données

La base est hébergée chez Neon en **`us-east-2` (Ohio)**, hors Azure et hors
Canada. Neon n'offre aucune région canadienne.

L'alternative examinée, Supabase (`ca-central-1`), met les projets de son palier
gratuit **en pause après 7 jours d'inactivité avec réveil manuel** : une
démonstration consultée plus tard serait hors service. Neon se réveille
automatiquement en quelques centaines de millisecondes.

Pour un projet académique manipulant des données **fictives**, la fiabilité de la
démonstration a été jugée prioritaire sur une localisation sans portée
réglementaire ici. Sur un déploiement réel, l'arbitrage s'inverserait : des
données de santé de patients réels au Canada relèvent de la LPRPDE et des lois
provinciales, et imposeraient une base en territoire canadien.
