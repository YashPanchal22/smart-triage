import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { wsUrl } from './api';

type Ctx = { lastEvent: { event: string; data: any; at: string } | null; connected: boolean };
const LiveCtx = createContext<Ctx>({ lastEvent: null, connected: false });

export function LiveProvider({ children }: { children: React.ReactNode }) {
  const [lastEvent, setLastEvent] = useState<Ctx['lastEvent']>(null);
  const [connected, setConnected] = useState(false);
  const timer = useRef<any>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let closed = false;
    const connect = () => {
      try {
        ws = new WebSocket(wsUrl());
        ws.onopen = () => setConnected(true);
        ws.onclose = () => { setConnected(false); if (!closed) timer.current = setTimeout(connect, 3000); };
        ws.onerror = () => { try { ws?.close(); } catch {} };
        ws.onmessage = (m) => { try { setLastEvent(JSON.parse(m.data)); } catch {} };
      } catch { timer.current = setTimeout(connect, 3000); }
    };
    connect();
    const ping = setInterval(() => { try { ws?.send('ping'); } catch {} }, 25000);
    return () => { closed = true; clearInterval(ping); clearTimeout(timer.current); try { ws?.close(); } catch {} };
  }, []);

  return <LiveCtx.Provider value={{ lastEvent, connected }}>{children}</LiveCtx.Provider>;
}

export const useLive = () => useContext(LiveCtx);
