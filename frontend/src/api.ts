import axios from 'axios';

export const api = axios.create({ baseURL: '' }); // use vite proxy / same-origin

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('triage_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401 && !location.pathname.startsWith('/login')) {
      localStorage.removeItem('triage_token');
      localStorage.removeItem('triage_user');
      location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const PRIORITY_META: Record<string, { label: string; dot: string; badge: string }> = {
  emergency: { label: 'Emergency', dot: '🔴', badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-300' },
  urgent: { label: 'Urgent', dot: '🟠', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-300' },
  semi_urgent: { label: 'Semi-Urgent', dot: '🟡', badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-300' },
  routine: { label: 'Routine', dot: '🟢', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300' },
};

export function wsUrl(): string {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${location.host}/ws/live`;
}
