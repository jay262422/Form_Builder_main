import authService from './authService';

/**
 * Fetch with Bearer token. On 401, refreshes the access token once and retries.
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<Response>}
 */
export async function authenticatedFetch(url, options = {}) {
  const buildHeaders = () => {
    const headers = {
      ...authService.getAuthHeaders(),
      ...(options.headers || {})
    };

    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    return headers;
  };

  let response = await fetch(url, {
    ...options,
    headers: buildHeaders()
  });

  if (response.status === 401 && authService.getRefreshToken()) {
    try {
      await authService.refreshAccessToken();
      response = await fetch(url, {
        ...options,
        headers: buildHeaders()
      });
    } catch {
      authService.clearSession();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
      }
      throw new Error('Session expired. Please log in again.');
    }
  }

  return response;
}

/**
 * @param {Response} response
 * @returns {Promise<any>}
 */
export async function parseApiResponse(response) {
  const payload = await response.json();

  if (!response.ok) {
    const message = payload?.message || payload?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(message);
  }

  return payload?.data !== undefined ? payload.data : payload;
}

/**
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<any>}
 */
export async function authenticatedJson(url, options = {}) {
  const response = await authenticatedFetch(url, options);
  return parseApiResponse(response);
}
