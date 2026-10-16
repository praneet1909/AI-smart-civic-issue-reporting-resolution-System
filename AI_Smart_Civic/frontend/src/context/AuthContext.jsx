import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session from localStorage and verify with backend
  useEffect(() => {
    const initSession = async () => {
      const storedToken = localStorage.getItem('civic_auth_token');
      const storedUser = localStorage.getItem('civic_auth_user');

      if (storedToken) {
        setToken(storedToken);
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            localStorage.removeItem('civic_auth_user');
          }
        }
        // Verify token with backend /api/auth/me
        try {
          const freshUser = await authService.getMe();
          setUser(freshUser);
          localStorage.setItem('civic_auth_user', JSON.stringify(freshUser));
        } catch (err) {
          console.warn('Session verification failed, logging out:', err.message);
          localStorage.removeItem('civic_auth_token');
          localStorage.removeItem('civic_auth_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initSession();
  }, []);

  const loginWithCredentials = async (email, password) => {
    const response = await authService.login(email, password);
    const authToken = response.token;
    const authUser = response.user;

    localStorage.setItem('civic_auth_token', authToken);
    localStorage.setItem('civic_auth_user', JSON.stringify(authUser));

    setToken(authToken);
    setUser(authUser);
    return authUser;
  };

  const registerCitizen = async (formData) => {
    return authService.register(formData);
  };

  const logout = useCallback(() => {
    localStorage.removeItem('civic_auth_token');
    localStorage.removeItem('civic_auth_user');
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: !!token && !!user,
    isLoading: loading,
    loginWithCredentials,
    registerCitizen,
    logout,
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

export default AuthContext;
