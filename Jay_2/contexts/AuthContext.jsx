"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First check localStorage
      const storedUser = authService.getUser();
      if (storedUser && authService.isAuthenticated()) {
        // Verify token is still valid by fetching current user
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        } catch (err) {
          // Token invalid, clear everything
          authService.logout();
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      setError(err.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.login(email, password);
      // Response structure: { success: true, data: { user, token } }
      if (response.data && response.data.user) {
        setUser(response.data.user);
      } else if (response.user) {
        // Fallback for different response structure
        setUser(response.user);
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, name) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.register(email, password, name);
      // Response structure: { success: true, data: { user, token } }
      if (response.data && response.data.user) {
        setUser(response.data.user);
      } else if (response.user) {
        // Fallback for different response structure
        setUser(response.user);
      }
      return response;
    } catch (err) {
      // Extract error message from response if available
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setError(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    checkAuth,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
