import { useEffect, useState } from 'react';
import { api } from '../api';
import { useLive } from '../live';
import { useAuth } from '../auth';

export default function Resources() {
  const [rows, setRows] = useState<any[]>([]);
  const { lastEvent } = useLive();
  const { user } = useAuth();
  const load = async () => { const { data } = await api.get('/api/resources'); setRows(data); };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (lastEvent?.event === 'resources_updated') load(); }, [lastEvent]);
  const setOcc = async (r: any, delta: number) => {
    const occupied = Math.min(r.total, Math.max(0, r.occupied + delta));
    await api.patch(`/api/resources/${r.id}`, { occupied });
    load();
  };
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Hospital Capacity</h1>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => {
          const pct = r.total ? Math.round((r.occupied / r.total) * 100) : 0;
          const color = pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500';
          return (
            <div key={r.id} className="card">
              <div className="flex items-center justify-between"><h3 className="font-bold">{r.ward_name}</h3><span className="text-xs text-slate-500">{r.resource_type}</span></div>
              <p className="mt-1 text-sm text-slate-500">Total: <b className="text-slate-800 dark:text-slate-100">{r.total}</b> · Occupied: <b className="text-slate-800 dark:text-slate-100">{r.occupied}</b> · Available: <b className="text-emerald-600">{r.available}</b></p>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><div className={`h-full ${color}`} style={{ width: `${pct}%` }} /></div>
              <p className="mt-1 text-xs text-slate-500">{pct}% occupied {pct >= 90 && '⚠️ threshold reached'}</p>
              {user?.role !== 'patient' && (
                <div className="mt-2 flex gap-2"><button onClick={() => setOcc(r, 1)} className="btn-ghost flex-1 !py-1 text-xs">＋ Admit</button><button onClick={() => setOcc(r, -1)} className="btn-ghost flex-1 !py-1 text-xs">－ Discharge</button></div>
              )}
            </div>);
        })}
      </div>
    </div>
  );
}
