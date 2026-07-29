#!/usr/bin/env bash
#
# Déploiement de MediPlan sur Azure.
#
#   ./scripts/deploy.sh --what-if    Prévisualise les changements, n'applique rien
#   ./scripts/deploy.sh              Déploie après confirmation
#
# Les secrets sont lus dans .env.azure (ignoré par git) et passés en paramètres
# @secure() : ils n'apparaissent ni dans les journaux Azure, ni dans la sortie
# de what-if, ni à l'écran.

set -euo pipefail

RACINE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FICHIER_SECRETS="$RACINE/.env.azure"
TEMPLATE="$RACINE/infra/main.bicep"
PARAMETRES="$RACINE/infra/main.bicepparam"
REGION="canadacentral"

MODE_PREVISUALISATION=false
[[ "${1:-}" == "--what-if" ]] && MODE_PREVISUALISATION=true

erreur() { echo "ERREUR : $*" >&2; exit 1; }

# --- Vérifications préalables ------------------------------------------------

command -v az >/dev/null || erreur "Azure CLI introuvable. Voir https://aka.ms/azure-cli"

[[ -f "$FICHIER_SECRETS" ]] || erreur "$FICHIER_SECRETS introuvable.
Créer ce fichier (il est ignoré par git) avec :

  DATABASE_URL=postgresql://utilisateur:motdepasse@hote.neon.tech/base?sslmode=require
  JWT_SECRET=<au moins 32 caractères aléatoires>

Pour générer un secret JWT :  openssl rand -base64 48"

# `set -a` exporte automatiquement ce que le fichier définit.
set -a
# shellcheck disable=SC1090
source "$FICHIER_SECRETS"
set +a

[[ -n "${DATABASE_URL:-}" ]] || erreur "DATABASE_URL absente de $FICHIER_SECRETS"
[[ -n "${JWT_SECRET:-}" ]] || erreur "JWT_SECRET absent de $FICHIER_SECRETS"
[[ ${#JWT_SECRET} -ge 32 ]] || erreur "JWT_SECRET fait ${#JWT_SECRET} caractères ; 32 au minimum sont requis."

az account show >/dev/null 2>&1 || erreur "Session Azure expirée. Lancer :  az login"

SOUSCRIPTION="$(az account show --query name -o tsv)"

# --- Récapitulatif -----------------------------------------------------------

echo ""
echo "  Souscription : $SOUSCRIPTION"
echo "  Région       : $REGION"
echo "  Template     : infra/main.bicep (portée souscription)"
echo "  Secrets      : chargés depuis .env.azure (jamais affichés)"
echo ""

# --- Prévisualisation --------------------------------------------------------
#
# Systématique, y compris avant un déploiement réel : on ne modifie
# l'infrastructure qu'après avoir lu ce qui va changer.

echo "Calcul des changements (what-if)..."
echo ""

az deployment sub what-if \
  --location "$REGION" \
  --template-file "$TEMPLATE" \
  --parameters "$PARAMETRES"

if $MODE_PREVISUALISATION; then
  echo ""
  echo "Prévisualisation uniquement — rien n'a été modifié."
  exit 0
fi

# --- Confirmation ------------------------------------------------------------

echo ""
read -r -p "Appliquer ces changements ? (oui/non) " reponse
[[ "$reponse" == "oui" ]] || { echo "Déploiement annulé."; exit 0; }

# --- Déploiement -------------------------------------------------------------

echo ""
echo "Déploiement en cours (quelques minutes au premier passage)..."

NOM_DEPLOIEMENT="mediplan-$(date +%Y%m%d-%H%M%S)"

az deployment sub create \
  --name "$NOM_DEPLOIEMENT" \
  --location "$REGION" \
  --template-file "$TEMPLATE" \
  --parameters "$PARAMETRES" \
  --output none

URL="$(az deployment sub show --name "$NOM_DEPLOIEMENT" --query properties.outputs.applicationUrl.value -o tsv)"
JOB_SEED="$(az deployment sub show --name "$NOM_DEPLOIEMENT" --query properties.outputs.seedJobName.value -o tsv)"
GROUPE="$(az deployment sub show --name "$NOM_DEPLOIEMENT" --query properties.outputs.resourceGroupName.value -o tsv)"

echo ""
echo "  Déploiement terminé."
echo ""
echo "  Application : $URL"
echo ""
echo "  Le premier accès prend quelques secondes : les conteneurs dorment"
echo "  (scale-to-zero) et doivent démarrer. Les migrations sont jouées"
echo "  automatiquement au démarrage du backend."
echo ""
echo "  Pour peupler le jeu de démonstration (ÉCRASE les données existantes) :"
echo "    az containerapp job start --name $JOB_SEED --resource-group $GROUPE"
echo ""
