/* Configuration publique : aucune clé secrète ne doit être placée ici. */
window.MONGANGA_CONFIG = Object.freeze({
  mode: 'demo', // 'api' pour connecter le serveur ; aucun retour automatique vers la démo.
  apiBaseUrl: '/api/v1',
  timeoutMs: 15000,
  timeZone: 'Africa/Kinshasa',
  paymentOrigins: [], // Origines HTTPS autorisées pour checkoutUrl, fournies par le backend.
  documentOrigins: [] // Origines HTTPS autorisées pour PDF/QR signés.
  // Charger window.MongangaCallProvider séparément ; voir BACKEND_INTEGRATION.md.
});
