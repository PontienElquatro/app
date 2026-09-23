/* ============================================================
   MONGANGA - Frontend API adapter
   Replace API_BASE_URL when the backend is available.
   ============================================================ */
(function () {
  const API_BASE_URL = window.MONGANGA_API_URL || '';
  const SESSION_KEY = 'monganga-session';

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    } catch (error) {
      return null;
    }
  }

  function setSession(session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  async function request(path, options = {}) {
    if (!API_BASE_URL) {
      throw new Error('API_NOT_CONFIGURED');
    }

    const session = getSession();
    const headers = new Headers(options.headers || {});
    headers.set('Accept', 'application/json');
    if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
    if (session?.token) headers.set('Authorization', `Bearer ${session.token}`);

    const body = options.body && !(options.body instanceof FormData) && typeof options.body !== 'string'
      ? JSON.stringify(options.body)
      : options.body;
    const response = await fetch(`${API_BASE_URL}${path}`, { ...options, body, headers });
    if (!response.ok) throw new Error(`API_${response.status}`);
    if (response.status === 204) return null;
    return response.json();
  }

  async function requestOrDemo(path, demoValue, options = {}) {
    try {
      return await request(path, options);
    } catch (error) {
      if (error.message !== 'API_NOT_CONFIGURED') console.warn(`[MONGANGA API] ${path}`, error);
      return typeof demoValue === 'function' ? demoValue() : demoValue;
    }
  }

  window.MongangaApi = {
    baseUrl: API_BASE_URL,
    getSession,
    setSession,
    clearSession,
    request,
    requestOrDemo
  };
})();
