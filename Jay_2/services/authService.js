/**
 * @typedef {Object} AuthSession
 * @property {string} [token]
 * @property {string} [accessToken]
 * @property {string} [refreshToken]
 * @property {Object} [user]
 * @property {string} [expiresIn]
 */

const getApiBaseURL = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004';
  }
  return process.env.API_URL || 'http://localhost:3004';
};

const API_BASE_URL = getApiBaseURL();
const AUTH_TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';
const REFRESH_BUFFER_MS = 60 * 1000;

/** @returns {number|null} */
export const getAccessTokenExpiryMs = (token) => {
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload?.exp) return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
};

class AuthService {
  constructor() {
    /** @type {ReturnType<typeof setTimeout>|null} */
    this.refreshTimer = null;
    /** @type {Promise<any>|null} */
    this.refreshPromise = null;
  }

  /** @param {AuthSession} sessionData */
  persistSession(sessionData = {}) {
    if (typeof window === 'undefined') return;

    const accessToken = sessionData.accessToken || sessionData.token;
    if (accessToken) {
      localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
    }
    if (sessionData.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, sessionData.refreshToken);
    }
    if (sessionData.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(sessionData.user));
    }

    this.scheduleProactiveRefresh();
  }

  clearSession() {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.clearRefreshTimer();
    this.refreshPromise = null;
  }

  clearRefreshTimer() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  scheduleProactiveRefresh() {
    this.clearRefreshTimer();
    if (typeof window === 'undefined') return;

    const token = this.getToken();
    const refreshToken = this.getRefreshToken();
    if (!token || !refreshToken) return;

    const expiresAt = getAccessTokenExpiryMs(token);
    if (!expiresAt) return;

    const delay = expiresAt - Date.now() - REFRESH_BUFFER_MS;

    if (delay <= 0) {
      this.refreshAccessToken().catch(() => {
        this.clearSession();
      });
      return;
    }

    this.refreshTimer = setTimeout(() => {
      this.refreshAccessToken().catch(() => {
        this.clearSession();
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
      });
    }, delay);
  }

  async refreshAccessToken() {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshPromise = (async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      const data = await response.json();

      if (!response.ok) {
        this.clearSession();
        throw new Error(data.message || 'Session expired');
      }

      this.persistSession(data.data || {});
      return data.data;
    })();

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  async register(email, password, name) {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.message || 'Registration failed');
      error.response = { data };
      throw error;
    }

    if (data.data) {
      this.persistSession(data.data);
    }

    return data;
  }

  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.message || 'Login failed');
      error.response = { data };
      throw error;
    }

    if (data.data) {
      this.persistSession(data.data);
    }

    return data;
  }

  async logout() {
    const token = this.getToken();
    const refreshToken = this.getRefreshToken();

    try {
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ refreshToken: refreshToken || '' })
        });
      }
    } catch {
      // Ignore network errors during logout
    }

    this.clearSession();
  }

  async getCurrentUser() {
    const token = this.getToken();
    if (!token) return null;

    const fetchMe = () => fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });

    let response = await fetchMe();

    if (response.status === 401 && this.getRefreshToken()) {
      await this.refreshAccessToken();
      response = await fetchMe();
    }

    const data = await response.json();

    if (!response.ok) {
      this.clearSession();
      throw new Error(data.message || 'Failed to get user');
    }

    if (data.data?.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
    }

    return data.data?.user || null;
  }

  async updateProfile(name, settings, profile = null) {
    const { authenticatedFetch } = await import('./apiClient');
    const response = await authenticatedFetch(`${API_BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      body: JSON.stringify({ name, settings, profile })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update profile');
    }

    if (data.data?.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
    }

    return data;
  }

  async changePassword(currentPassword, newPassword) {
    const { authenticatedFetch } = await import('./apiClient');
    const response = await authenticatedFetch(`${API_BASE_URL}/api/auth/change-password`, {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to change password');
    }

    return data;
  }

  async requestPasswordReset(email) {
    const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to request password reset');
    }

    return data;
  }

  async resetPassword(token, newPassword) {
    const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to reset password');
    }

    return data;
  }

  async verifyEmail(token) {
    const response = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to verify email');
    }

    const currentUser = this.getUser();
    if (currentUser) {
      currentUser.isEmailVerified = true;
      localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
    }

    return data;
  }

  async resendVerificationEmail() {
    const { authenticatedFetch } = await import('./apiClient');
    const response = await authenticatedFetch(`${API_BASE_URL}/api/auth/resend-verification`, {
      method: 'POST'
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to resend verification email');
    }

    return data;
  }

  getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  getRefreshToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  getUser() {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  getAuthHeaders() {
    const token = this.getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }
}

const authService = new AuthService();
export default authService;
