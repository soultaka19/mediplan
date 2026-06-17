/**
 * Configuration d'environnement — développement.
 *
 * `apiUrl` est volontairement relatif : en dev le proxy `ng serve`
 * (proxy.conf.json) route `/api` vers le backend NestJS, et en prod c'est
 * nginx qui s'en charge. L'application n'utilise donc QUE des URLs relatives.
 */
export const environment = {
  production: false,
  apiUrl: '/api/v1',
};
