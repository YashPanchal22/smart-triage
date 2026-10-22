import axios from 'axios';
import { routeMock } from './mockApi';

export const isStaticDemo = typeof window !== 'undefined' && 
  (window.location.hostname.includes('github.io') || window.location.protocol === 'file:');

export const api = axios.create({ baseURL: '' });

api.interceptors.request.use(async (cfg) => {
  const t = localStorage.getItem('triage_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;

  // If running on static host (GitHub Pages), resolve immediately with full realistic demo data
  if (isStaticDemo) {
    cfg.adapter = async (config) => {
      let parsedData: any = config.data;
      if (typeof parsedData === 'string') {
        try { parsedData = JSON.parse(parsedData); } catch {}
      }
      const mockResult = routeMock(config.method || 'get', config.url || '', parsedData, config.params);
      return {
        data: mockResult,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };
  }

  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    // If backend gave 404 or network connection error, fallback to mock data seamlessly!
    const cfg = err?.config;
    if (cfg && (err.response?.status === 404 || !err.response || err.code === 'ERR_NETWORK')) {
      let parsedData: any = cfg.data;
      if (typeof parsedData === 'string') {
        try { parsedData = JSON.parse(parsedData); } catch {}
      }
      const mockResult = routeMock(cfg.method || 'get', cfg.url || '', parsedData, cfg.params);
      return {
        data: mockResult,
        status: 200,
        statusText: 'OK (Mock Fallback)',
        headers: {},
        config: cfg,
      };
    }

    if (err?.response?.status === 401 && !window.location.hash.includes('login')) {
      localStorage.removeItem('triage_token');
      localStorage.removeItem('triage_user');
      window.location.hash = '#/login';
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
