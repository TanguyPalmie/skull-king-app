import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const api = useCallback(async (path, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (response.status === 401 && accessToken) {
      const refreshed = await refreshToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${refreshed}`;
        return fetch(`${API_BASE}${path}`, {
          ...options,
          headers,
          credentials: 'include',
        });
      }
    }

    return response;
  }, [accessToken]);

  const refreshToken = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setAccessToken(data.accessToken);
        setUser(data.user);
        return data.accessToken;
      }
      setAccessToken(null);
      setUser(null);
      return null;
    } catch {
      setAccessToken(null);
      setUser(null);
      return null;
    }
  }, []);

  const login = useCallback((token, userData) => {
    setAccessToken(token);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });
    } catch {
      // ignore logout errors
    }
    setAccessToken(null);
    setUser(null);
  }, [accessToken]);

  useEffect(() => {
    const init = async () => {
      await refreshToken();
      setLoading(false);
    };
    init();
  }, [refreshToken]);

  const value = useMemo(() => ({
    user,
    accessToken,
    loading,
    login,
    logout,
    refreshToken,
    api,
    isAuthenticated: !!accessToken && !!user,
  }), [user, accessToken, loading, login, logout, refreshToken, api]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
