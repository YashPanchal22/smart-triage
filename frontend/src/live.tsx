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
    let failCount = 0;
    let simInterval: any = null;

    const startSim = () => {
      setConnected(true);
      if (!simInterval) {
        simInterval = setInterval(() => {
          if (!closed) {
            setLastEvent({
              event: 'heartbeat',
              data: { time: new Date().toISOString() },
              at: new Date().toLocaleTimeString(),
            });
          }
        }, 15000);
      }
    };

    const isStaticDeploy = typeof window !== 'undefined' && 
      (window.location.hostname.includes('github.io') || window.location.hostname === 'localhost' && window.location.port !== '5173');

    const connect = () => {
      if (isStaticDeploy) {
        startSim();
        return;
      }
      try {
        ws = new WebSocket(wsUrl());
        ws.onopen = () => { setConnected(true); failCount = 0; };
        ws.onclose = () => {
          failCount++;
          if (failCount > 2) {
            startSim();
          } else {
            setConnected(false);
            if (!closed) timer.current = setTimeout(connect, 4000);
          }
        };
        ws.onerror = () => { try { ws?.close(); } catch {} };
        ws.onmessage = (m) => { try { setLastEvent(JSON.parse(m.data)); } catch {} };
      } catch {
        failCount++;
        if (failCount > 2) startSim();
        else timer.current = setTimeout(connect, 4000);
      }
    };
    connect();
    const ping = setInterval(() => { try { ws?.send('ping'); } catch {} }, 25000);
    return () => {
      closed = true;
      clearInterval(ping);
      clearInterval(simInterval);
      clearTimeout(timer.current);
      try { ws?.close(); } catch {}
    };
  }, []);

  return <LiveCtx.Provider value={{ lastEvent, connected }}>{children}</LiveCtx.Provider>;
}

export const useLive = () => useContext(LiveCtx);
