import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi, tokenStore } from './api';
import type { User } from './types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; phone?: string }) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = tokenStore.get();
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(setUser)
      .catch(() => {
        tokenStore.clear();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // When any API call 401s (expired/invalidated token), drop the in-memory user so
  // protected routes redirect to /login without needing a hard reload (M31).
  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener('mm-unauthorized', onUnauthorized);
    return () => window.removeEventListener('mm-unauthorized', onUnauthorized);
  }, []);

  const login = async (email: string, password: string) => {
    const { token, user } = await authApi.login({ email, password });
    tokenStore.set(token);
    qc.clear(); // never serve a previous account's cached data (e.g. trial/paywall state)
    setUser(user);
  };

  const loginWithGoogle = async (credential: string) => {
    const { token, user } = await authApi.google(credential);
    tokenStore.set(token);
    qc.clear();
    setUser(user);
  };

  const register = async (data: { email: string; password: string; name: string; phone?: string }) => {
    const { token, user } = await authApi.register(data);
    tokenStore.set(token);
    qc.clear();
    setUser(user);
  };

  const logout = () => {
    tokenStore.clear();
    qc.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, register, logout, updateUser: setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
