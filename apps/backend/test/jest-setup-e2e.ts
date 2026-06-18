/**
 * Variables d'environnement par défaut pour les tests e2e.
 *
 * Rend la suite e2e autonome et reproductible (y compris en CI) sans dépendre
 * d'un fichier `.env` : on fixe des valeurs de test si — et seulement si — elles
 * ne sont pas déjà fournies par l'environnement. Les valeurs DB correspondent au
 * `docker-compose.yml` local (Postgres doit tourner et être migré).
 */
process.env.JWT_SECRET ??= 'e2e_test_secret_min_32_chars_loooooong';
process.env.JWT_EXPIRES_IN ??= '60m';
process.env.BCRYPT_ROUNDS ??= '12';
process.env.DB_HOST ??= 'localhost';
process.env.DB_PORT ??= '5432';
process.env.DB_NAME ??= 'mediplan';
process.env.DB_USER ??= 'mediplan_app';
process.env.DB_PASSWORD ??= 'change_me';
