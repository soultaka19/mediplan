#!/bin/sh
#
# Point d'entrée du conteneur backend.
#
# En local (Docker Compose), les migrations sont jouées à la main par le
# développeur : ce script démarre simplement l'API. En hébergement cloud, il
# n'existe aucune console pour lancer une commande avant le démarrage, et les
# répliques naissent et meurent au gré du scale-to-zero — d'où l'exécution des
# migrations au démarrage, activée par RUN_MIGRATIONS_ON_BOOT=true.
#
# C'est sûr : TypeORM enveloppe chaque migration dans une transaction et tient
# une table `migrations` qui garantit qu'une migration déjà jouée est ignorée.
# Un réveil de conteneur ne rejoue donc rien.
#
# Le seed de démonstration n'est volontairement PAS ici : il purge et réinsère
# les données, ce qui effacerait à chaque réveil les rendez-vous créés pendant
# une démonstration. Il est exécuté à la demande, via un job dédié qui réutilise
# cette même image (voir /infra et docs/deployment).

set -e

if [ "$RUN_MIGRATIONS_ON_BOOT" = "true" ]; then
  echo "[entrypoint] Exécution des migrations TypeORM..."
  node ./node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js
  echo "[entrypoint] Migrations à jour."
fi

echo "[entrypoint] Démarrage de l'API NestJS."
exec node dist/main.js
