import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api, clearStoredToken, getStoredToken, setStoredToken } from '../lib/api';
import type { LoginPayload } from '../lib/api';
import type { User } from '../types/api';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isBooting: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<User | null>(null);
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function restore() {
      const stored = getStoredToken();
      if (!stored) {
        setIsBooting(false);
        return;
      }
      try {
        const user = await api.me(controller.signal);
        setUser(user);
        setToken(stored);
      } catch {
        clearStoredToken();
        setUser(null);
        setToken(null);
      } finally {
        setIsBooting(false);
      }
    }
    void restore();
    return () => controller.abort();
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await api.login(payload);
    setStoredToken(response.token);
    setToken(response.token);
    setUser(response.user);
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setUser(null);
    window.sessionStorage.clear();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({ user, token, isBooting, login, logout }), [user, token, isBooting, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
