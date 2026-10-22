import { useEffect, useState } from 'react';
import { api } from '../api';
import { Empty, Loading } from '../components';
import { useAuth } from '../auth';

// ---- Notifications ----
export function Notifications() {
  const [rows, setRows] = useState<any[]>([]);
  const load = async () => { const { data } = await api.get('/api/notifications'); setRows(data); };
  useEffect(() => { load(); }, []);
  const readOne = async (id: number) => { await api.post(`/api/notifications/${id}/read`); load(); };
  const readAll = async () => { await api.post('/api/notifications/read-all'); load(); };
  const icon: Record<string, string> = { emergency: '🚨', info: 'ℹ️', assignment: '👨‍⚕️', priority: '🎯', resource: '🛏️', appointment: '📅' };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">Notification Center</h1><button onClick={readAll} className="btn-ghost">Mark all read</button></div>
      {rows.length === 0 ? <Empty text="No notifications." /> : (
        <div className="space-y-2">{rows.map((n) => (
          <div key={n.id} className={`card !p-3 flex items-start justify-between gap-3 ${n.is_read ? 'opacity-70' : ''}`}>
            <div><p className="font-semibold">{icon[n.type] || '🔔'} {n.title} {!n.is_read && <span className="ml-1 rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] text-white">NEW</span>}</p>
              <p className="text-sm text-slate-500">{n.message}</p><p className="text-xs text-slate-400">{n.created_at?.slice(0, 19).replace('T', ' ')} · {n.type}</p></div>
            {!n.is_read && <button onClick={() => readOne(n.id)} className="btn-ghost !py-1 text-xs">Mark read</button>}
          </div>))}</div>)}
    </div>
  );
}

// ---- Triage rules / settings ----
export function Settings() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const load = async () => { setLoading(true); try { const { data } = await api.get('/api/triage/rules'); setRules(data); } catch {} finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const toggle = async (r: any) => { await api.patch(`/api/triage/rules/${r.id}`, { active: !r.active }); load(); };
  if (loading) return <Loading />;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Triage Rules & Configuration</h1>
      <p className="text-sm text-slate-500">Transparent scoring reference used by the priority engine (admin-configurable). Decision-support only.</p>
      <div className="card !p-0 overflow-x-auto"><table className="grid-table">
        <thead><tr><th>Rule</th><th>Category</th><th>Points</th><th>Forces</th><th>Description</th><th>Active</th></tr></thead>
        <tbody>{rules.map((r) => (
          <tr key={r.id}><td className="font-semibold">{r.name}</td><td>{r.category}</td><td>+{r.points}</td><td>{r.priority || '—'}</td><td className="max-w-[300px] text-xs">{r.description}</td>
            <td>{user?.role === 'admin' ? <button onClick={() => toggle(r)} className={`rounded-full px-2 py-0.5 text-xs font-bold ${r.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{r.active ? 'ON' : 'OFF'}</button> : (r.active ? 'ON' : 'OFF')}</td></tr>))}</tbody>
      </table></div>
      <div className="card text-sm"><b>Score → category:</b> ≥30 🔴 Emergency · ≥20 🟠 Urgent · ≥10 🟡 Semi-Urgent · else 🟢 Routine. Staff may override with a recorded reason (audit trail).</div>
    </div>
  );
}
