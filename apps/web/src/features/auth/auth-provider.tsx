'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import type { User } from '@/types/api';

type AuthState = {
  user: User | null;
  status: 'loading' | 'ready';
  refresh: () => Promise<void>;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');

  const refresh = useCallback(async () => {
    try {
      const result = await api<{ data: { user: User } }>('/api/auth/me');
      setUser(result.data.user);
    } catch (error) {
      if (error instanceof ApiError && error.status !== 0) setUser(null);
      else setUser(null);
    } finally {
      setStatus('ready');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(() => ({ user, status, refresh, setUser }), [user, status, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
