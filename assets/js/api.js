(function (root) {
  'use strict';
  const config = root.MONGANGA_CONFIG || { mode: 'demo', apiBaseUrl: '' };
  const SESSION_KEY = 'monganga-session-v2';
  let session = null, csrfToken = null, csrfPromise = null;
  class ApiError extends Error {
    constructor(message, status = 0, code = 'REQUEST_FAILED', fields = {}) {
      super(message); this.name = 'ApiError'; this.status = status; this.code = code; this.fields = fields;
    }
  }
  function isConfigured() { return config.mode === 'api'; }
  function getSession() {
    if (isConfigured()) return session;
    try { session = JSON.parse(root.sessionStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
    if (session && (!Number.isFinite(Date.parse(session.expiresAt)) || Date.parse(session.expiresAt) <= Date.now())) { clearSession(); return null; }
    return session;
  }
  function setSession(value) {
    if (!value?.id || !value?.name || !['patient', 'doctor', 'admin'].includes(value.role)) throw new ApiError('Session invalide.');
    // Métadonnées uniquement. Authentification API via cookie HttpOnly, jamais de jeton persistant.
    session = { id: value.id, role: value.role, name: value.name, email: value.email, doctorId: value.doctorId,
      expiresAt: value.expiresAt || new Date(Date.now() + 8 * 3600000).toISOString(), demo: !isConfigured() };
    if (!isConfigured()) root.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }
  function clearSession() {
    session = null; csrfToken = null;
    root.sessionStorage.removeItem(SESSION_KEY);
    try { root.localStorage.removeItem('monganga-session'); } catch { /* Ancien stockage facultatif. */ }
  }
  function errorMessage(error) {
    if (error?.name === 'AbortError') return 'Opération interrompue.';
    if (error?.status === 401) return 'Session expirée. Reconnectez-vous.';
    if (error?.status === 403) return 'Cette action n’est pas autorisée pour votre compte.';
    if (error?.status === 409) return error.message || 'Les informations ont changé. Actualisez puis réessayez.';
    if (error?.status === 429) return 'Trop de tentatives. Patientez avant de réessayer.';
    if (error?.status >= 500) return 'Le service est indisponible. Réessayez dans quelques instants.';
    return error?.message || 'Une erreur est survenue.';
  }
  async function request(path, options = {}) {
    if (!isConfigured()) throw new ApiError('Service non connecté en démonstration.', 0, 'API_NOT_CONFIGURED');
    if (!/^\/(?!\/)/.test(path)) throw new ApiError('Chemin API invalide.');
    const { timeoutMs, signal, ...init } = options;
    const controller = new AbortController(); let timedOut = false;
    const abort = () => controller.abort();
    if (signal?.aborted) abort(); else signal?.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs || config.timeoutMs || 15000);
    const headers = new Headers(init.headers || {});
    headers.set('Accept', 'application/json');
    let body = init.body;
    if (body && !(body instanceof FormData) && typeof body !== 'string') { headers.set('Content-Type', 'application/json'); body = JSON.stringify(body); }
    try {
      if (!['GET','HEAD','OPTIONS'].includes((init.method || 'GET').toUpperCase())) {
        const cookie = (root.document?.cookie || '').split('; ').find(c => c.startsWith('monganga_csrf='));
        let token; try { token = cookie && decodeURIComponent(cookie.slice(14)); } catch {}
        if (!token && !csrfToken) {
          csrfPromise ||= request('/auth/csrf').then(value => {
            if (!value?.csrfToken) throw new ApiError('Protection du formulaire indisponible. Réessayez.',502);
            csrfToken = value.csrfToken;
          }).finally(() => { csrfPromise = null; });
          await csrfPromise;
        }
        headers.set('X-CSRF-Token', token || csrfToken);
      }
      const response = await root.fetch(String(config.apiBaseUrl || '/api/v1').replace(/\/$/, '') + path, { ...init, body, headers, credentials: 'include', signal: controller.signal });
      const raw = response.status === 204 ? '' : await response.text();
      let payload = null;
      if (raw) { try { payload = JSON.parse(raw); } catch { if (response.ok) throw new ApiError('Réponse du serveur illisible.', 502); } }
      if (!response.ok) {
        if (response.status === 401) { clearSession(); root.dispatchEvent?.(new Event('monganga:unauthorized')); }
        throw new ApiError(payload?.message || 'La requête a échoué.', response.status, payload?.code, payload?.fields);
      }
      return payload;
    } catch (error) {
      if (timedOut) throw new ApiError('Délai dépassé. Réessayez.', 0, 'TIMEOUT');
      if (error instanceof ApiError || error.name === 'AbortError') throw error;
      throw new ApiError('Impossible de joindre le serveur. Vérifiez votre connexion.', 0, 'NETWORK');
    } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
  }
  async function restore() { if (!isConfigured()) return getSession(); const value = await request('/auth/me'); return setSession(value); }
  root.MongangaApi = { request, getSession, setSession, clearSession, isConfigured, restore, errorMessage, ApiError };
})(window);
