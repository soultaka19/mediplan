/**
 * Configuration d'environnement — production.
 *
 * `apiUrl` reste relatif : nginx (conteneur prod) proxifie `/api/` vers le
 * backend. Remplacé automatiquement via `fileReplacements` dans angular.json.
 */
export const environment = {
  production: true,
  apiUrl: '/api/v1',
};
