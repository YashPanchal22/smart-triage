import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

export type User = { id: number; username: string; email: string; full_name: string; role: string };

type Ctx = { user: User | null; login: (u: string, p: string) => Promise<void>; logout: () => void; refresh: () => Promise<void> };
const AuthCtx = createContext<Ctx>({ user: null, login: async () => {}, logout: () => {}, refresh: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem('triage_user') || 'null'); } catch { return null; }
  });
  const login = async (username: string, password: string) => {
    const { data } = await api.post('/api/auth/login-json', { username, password });
    localStorage.setItem('triage_token', data.access_token);
    localStorage.setItem('triage_user', JSON.stringify(data.user));
    setUser(data.user);
  };
  const logout = () => {
    localStorage.removeItem('triage_token'); localStorage.removeItem('triage_user');
    setUser(null); window.location.hash = '#/login';
  };
  const refresh = async () => {
    try { const { data } = await api.get('/api/auth/me'); setUser(data); localStorage.setItem('triage_user', JSON.stringify(data)); }
    catch { /* keep cached */ }
  };
  useEffect(() => { if (localStorage.getItem('triage_token')) refresh(); }, []);
  return <AuthCtx.Provider value={{ user, login, logout, refresh }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
