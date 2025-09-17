
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User, Role } from '../types';
import { MOCK_USERS } from '../data/mockData';

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

  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    // Mock API call
    return new Promise(resolve => {
        setTimeout(() => {
            const foundUser = MOCK_USERS.find(u => u.email.split('@')[0] === username); // Simple check
            if (foundUser) {
                const mockToken = 'JWT_TOKEN_' + Math.random().toString(36).substr(2);
                setUser(foundUser);
                setToken(mockToken);
                localStorage.setItem('authToken', mockToken);
                localStorage.setItem('authUser', JSON.stringify(foundUser));
                resolve(true);
            } else {
                resolve(false);
            }
            setLoading(false);
        }, 1000);
    });
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
