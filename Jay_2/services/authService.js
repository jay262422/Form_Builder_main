/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

const getApiBaseURL = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004';
  }
  return process.env.API_URL || 'http://localhost:3004';
};

const API_BASE_URL = getApiBaseURL();

class AuthService {
  /**
   * Register a new user
   */
  async register(email, password, name) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Create error with response data for better error handling
        const error = new Error(data.message || 'Registration failed');
        error.response = { data };
        throw error;
      }

      // Store token in localStorage
      if (data.data?.token) {
        localStorage.setItem('authToken', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.message || 'Login failed');
        error.response = { data };
        throw error;
      }

      // Store token in localStorage
      if (data.data?.token) {
        localStorage.setItem('authToken', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Logout user
   */
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    try {
      const token = this.getToken();
      if (!token) {
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Token might be invalid, clear it
        this.logout();
        throw new Error(data.message || 'Failed to get user');
      }

      // Update stored user
      if (data.data?.user) {
        localStorage.setItem('user', JSON.stringify(data.data.user));
      }

      return data.data?.user || null;
    } catch (error) {
      this.logout();
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(name, settings, profile = null) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name, settings, profile }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      // Update stored user
      if (data.data?.user) {
        localStorage.setItem('user', JSON.stringify(data.data.user));
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(currentPassword, newPassword) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to request password reset');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token, newPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify email');
      }

      // Update stored user if authenticated
      const currentUser = this.getUser();
      if (currentUser) {
        currentUser.isEmailVerified = true;
        localStorage.setItem('user', JSON.stringify(currentUser));
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend verification email');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get stored token
   */
  getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  }

  /**
   * Get stored user
   */
  getUser() {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.getToken();
  }

  /**
   * Get auth headers for API requests
   */
  getAuthHeaders() {
    const token = this.getToken();
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    };
  }
}

export default new AuthService();
