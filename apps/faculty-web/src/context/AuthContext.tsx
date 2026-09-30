import React, { createContext, useContext, useState, useEffect } from 'react';
import { LockWatchApiClient } from '@lockwatch/api-client';

interface AuthContextType {
  client: LockWatchApiClient;
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password?: string, pin?: string, institutionCode?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Web client configured with localStorage storage adapter
export const apiClient = new LockWatchApiClient({
  baseUrl: 'http://localhost:4000',
  storage: {
    getItem: (key) => localStorage.getItem(key),
    setItem: (key, val) => localStorage.setItem(key, val),
    removeItem: (key) => localStorage.removeItem(key)
  }
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = apiClient.getAccessToken();
      if (token) {
        try {
          const profile = await apiClient.getFacultyMe();
          setUser(profile);
        } catch {
          apiClient.clearTokens();
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (identifier: string, password?: string, pin?: string, institutionCode: string = 'TECH-UNI') => {
    const res = await apiClient.facultyLogin({
      identifier,
      password,
      pin,
      institutionCode
    });
    setUser(res.user);
  };

  const logout = () => {
    apiClient.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ client: apiClient, user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
