import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = window.localStorage.getItem('auth');
      if (!raw) return null;

      const parsed = JSON.parse(raw) as { user: AuthUser | null; token: string | null };
      if (parsed && parsed.user && parsed.token) {
        return parsed.user;
      }
    } catch (err) {
      console.error('Failed to restore auth user from storage', err);
    }

    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      const raw = window.localStorage.getItem('auth');
      if (!raw) return null;

      const parsed = JSON.parse(raw) as { user: AuthUser | null; token: string | null };
      if (parsed && parsed.user && parsed.token) {
        return parsed.token;
      }
    } catch (err) {
      console.error('Failed to restore auth token from storage', err);
    }

    return null;
  });

  const value: AuthContextValue = {
    isAuthenticated: !!token,
    user,
    token,
    login: (nextUser, nextToken) => {
      setUser(nextUser);
      setToken(nextToken);

      try {
        window.localStorage.setItem('auth', JSON.stringify({ user: nextUser, token: nextToken }));
      } catch (err) {
        console.error('Failed to persist auth to storage', err);
      }
    },
    logout: () => {
      setUser(null);
      setToken(null);

      try {
        window.localStorage.removeItem('auth');
      } catch (err) {
        console.error('Failed to clear auth from storage', err);
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
