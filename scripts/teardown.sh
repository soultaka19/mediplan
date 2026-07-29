#!/usr/bin/env bash
#
# Suppression de l'infrastructure MediPlan sur Azure.
#
#   ./scripts/teardown.sh
#
# Supprime le groupe de ressources et tout ce qu'il contient. Opération
# IRRÉVERSIBLE, d'où la double confirmation.
#
# Ce que ce script NE supprime PAS :
#   - la base de données Neon (hors Azure) : les données de démonstration
#     survivent, et un redéploiement les retrouve telles quelles ;
#   - les images sur ghcr.io.
#
# Un redéploiement est donc possible à tout moment avec ./scripts/deploy.sh.

set -euo pipefail

GROUPE="${1:-rg-projet-dev}"

erreur() { echo "ERREUR : $*" >&2; exit 1; }

command -v az >/dev/null || erreur "Azure CLI introuvable."
az account show >/dev/null 2>&1 || erreur "Session Azure expirée. Lancer :  az login"

if ! az group exists --name "$GROUPE" | grep -q true; then
  echo "Le groupe de ressources « $GROUPE » n'existe pas. Rien à supprimer."
  exit 0
fi

SOUSCRIPTION="$(az account show --query name -o tsv)"

echo ""
echo "  Souscription : $SOUSCRIPTION"
echo "  Groupe       : $GROUPE"
echo ""
echo "  Ressources qui seront DÉTRUITES :"
echo ""
az resource list --resource-group "$GROUPE" --query "[].{Nom:name, Type:type}" -o table
echo ""
echo "  Cette opération est irréversible."
echo "  (La base Neon et les images ghcr.io ne sont pas touchées.)"
echo ""

read -r -p "Confirmer la suppression ? (oui/non) " reponse
[[ "$reponse" == "oui" ]] || { echo "Suppression annulée."; exit 0; }

# Seconde confirmation : retaper le nom du groupe évite une destruction par
# réflexe, et garantit qu'on supprime bien celui qu'on croit.
read -r -p "Retaper le nom du groupe pour confirmer ($GROUPE) : " confirmation
[[ "$confirmation" == "$GROUPE" ]] || { echo "Le nom ne correspond pas. Suppression annulée."; exit 0; }

echo ""
echo "Suppression en cours..."

az group delete --name "$GROUPE" --yes --no-wait

echo ""
echo "  Suppression lancée en arrière-plan."
echo "  Suivre l'avancement :  az group show --name $GROUPE"
echo "  (la commande échouera avec « not found » une fois la suppression terminée)"
echo ""
