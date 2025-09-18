import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../types';

// --- API Helper ---
export const API_BASE_URL = 'http://127.0.0.1:5000/api';

const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem('authToken');
  } catch (e) {
    return null;
  }
};

// Fix: Updated the type of `options` in `apiRequest` to correctly handle object bodies.
export const apiRequest = async <T,>(endpoint: string, options: Omit<RequestInit, 'body'> & { body?: unknown } = {}): Promise<T> => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // FIX: Destructure body from options to resolve type error when creating RequestInit.
  // This avoids spreading `body: unknown` while preserving the original logic of
  // stringifying object bodies and passing other types through.
  const { body, ...restOfOptions } = options;
  const config: RequestInit = {
    ...restOfOptions,
    headers,
  };

  if (body && typeof body === 'object') {
    config.body = JSON.stringify(body);
  } else if (body !== undefined) {
    config.body = body as BodyInit;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    if (response.status === 401 && endpoint !== '/auth/login') {
        console.error('Unauthorized request. Logging out.');
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        // Use hash-based navigation for compatibility with HashRouter
        window.location.hash = '/login';
    }
    const errorData = await response.json().catch(() => ({ error: 'An unknown API error occurred' }));
    throw new Error(errorData.error || response.statusText);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
};
// --- End API Helper ---


interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('authUser');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse auth data from localStorage", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
        const response = await apiRequest<{token: string, user: User}>('/auth/login', {
            method: 'POST',
            body: { email, password }
        });

        if (response.token && response.user) {
            setUser(response.user);
            setToken(response.token);
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('authUser', JSON.stringify(response.user));
            return true;
        }
        return false;
    } catch (error) {
        console.error("Login failed:", error);
        return false;
    } finally {
        setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
