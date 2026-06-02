'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';

import { api } from '@/src/app/lib/api-client';
import { UserProfileResponse } from '@/src/app/lib/types';

interface AuthContextType {
  user: UserProfileResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    return api.get<UserProfileResponse>('/users/me');
  }, []);

  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        if (!cancelled) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const userData = await loadUser();

        if (!cancelled) {
          setUser(userData);
        }
      } catch {
        localStorage.removeItem('token');

        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      cancelled = true;
    };
  }, [loadUser]);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setUser(null);
        return;
      }

      const userData = await loadUser();
      setUser(userData);
    } catch {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [loadUser]);

  const logout = useCallback(async () => {
    localStorage.removeItem('token');
    sessionStorage.clear();

    setUser(null);
    setIsLoading(false);

    window.location.replace('/login');
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
