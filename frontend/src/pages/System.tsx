import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';

export default function System() {
  const { user } = useAuth();
  const [tab, setTab] = useState('config');
  const [cfg, setCfg] = useState<any>({});
  const [stats, setStats] = useState<any>({});
  const [sec, setSec] = useState<any[]>([]);
  const isSuper = user?.role === 'superadmin';

  useEffect(() => {
    api.get('/api/admin/settings').then((r) => setCfg(r.data)).catch(() => {});
    api.get('/api/admin/db-stats').then((r) => setStats(r.data)).catch(() => {});
    api.get('/api/admin/security?limit=80').then((r) => setSec(r.data)).catch(() => {});
  }, []);

  const saveCfg = async () => {
    try { await api.patch('/api/admin/settings', cfg); alert('Settings saved ✓'); } catch (err: any) { alert(err?.response?.data?.detail || 'Super Admin only'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-black tracking-tight">⚙️ System</h1>
        <div className="flex gap-2">{[['config', '⚙️ Configuration'], ['db', '🗄️ Database'], ['sec', '🔐 Security']].map(([v, l]) => <button key={v} onClick={() => setTab(v)} className={`rounded-full px-4 py-1.5 text-sm font-bold ${tab === v ? 'bg-brand-600 text-white' : 'border border-slate-300 dark:border-slate-700'}`}>{l}</button>)}</div>
      </div>

      {tab === 'config' && (
        <div className="card space-y-3">
          <h3 className="h-section">System configuration</h3>
          {!isSuper && <p className="text-xs text-slate-500">Read-only for Hospital Admin — editing requires Super Admin.</p>}
          {Object.entries(cfg).map(([k, v]) => (
            <div key={k} className="grid gap-1 md:grid-cols-3 md:items-center">
              <label className="font-mono text-sm font-bold">{k}</label>
              <input disabled={!isSuper} className="input md:col-span-2" value={String(v)} onChange={(e) => setCfg({ ...cfg, [k]: e.target.value })} />
            </div>))}
          {isSuper && <button onClick={saveCfg} className="btn-primary">Save settings</button>}
        </div>)}

      {tab === 'db' && (
        <div className="card">
          <h3 className="h-section">Database monitoring (row counts)</h3>
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">{Object.entries(stats).sort((a: any, b: any) => b[1] - a[1]).map(([k, v]) => (
            <div key={k} className="rounded-xl bg-slate-50 dark:bg-white/5 p-2.5"><p className="font-mono text-xs text-slate-500">{k}</p><p className="text-xl font-black">{String(v)}</p></div>))}</div>
        </div>)}

      {tab === 'sec' && (
        <div className="card !p-0 overflow-hidden">
          <div className="p-4 pb-2"><h3 className="h-section">Security events</h3></div>
          <div className="max-h-[500px] overflow-y-auto"><table className="grid-table">
            <thead><tr><th>ID</th><th>User</th><th>Action</th><th>Entity</th><th>Time</th></tr></thead>
            <tbody>{sec.map((s) => <tr key={s.id}><td className="font-mono">{s.id}</td><td>#{s.user_id}</td><td className="font-bold">{s.action}</td><td>{s.entity}</td><td className="text-xs">{s.at?.slice(0, 19).replace('T', ' ')}</td></tr>)}</tbody>
          </table></div>
        </div>)}
    </div>
  );
}
