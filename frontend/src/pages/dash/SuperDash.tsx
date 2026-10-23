import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { Ecg, Kpi, Loading } from '../../components';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0d9488', '#0284c7', '#8b5cf6', '#ef4444', '#f43f5e', '#f59e0b', '#a855f7', '#6366f1', '#111827'];

export default function SuperDash() {
  const [d, setD] = useState<any>(null);
  useEffect(() => { api.get('/api/superadmin/overview').then((r) => setD(r.data)).catch(() => {}); }, []);
  if (!d) return <Loading text="Loading system dashboard…" />;
  const tables = Object.entries(d.tables || {}).sort((a: any, b: any) => b[1] - a[1]).slice(0, 12).map(([name, value]) => ({ name, value }));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><h1 className="text-2xl font-black tracking-tight">🛡️ System Command</h1><Ecg className="h-4 w-40 text-indigo-500" /><p className="text-sm text-slate-500">Super Admin · platform health & governance (passwords never shown)</p></div>
        <div className="flex gap-2"><Link to="/users" className="btn-primary">👥 Users</Link><Link to="/system" className="btn-ghost">⚙️ System</Link></div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi title="Total users" value={d.users_total || 0} icon="👥" sub={`${d.users_active || 0} active`} />
        <Kpi title="Roles in use" value={(d.by_role || []).length} icon="🔐" />
        <Kpi title="DB tables" value={Object.keys(d.tables || {}).length} icon="🗄️" />
        <Kpi title="Patient records" value={(d.tables?.patients || 0)} icon="🧑‍🤝‍🧑" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card"><h3 className="h-section">Users by role</h3>
          <div className="h-60"><ResponsiveContainer><PieChart><Pie data={d.by_role || []} dataKey="count" nameKey="role" outerRadius={85} label>{(d.by_role || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
          <div className="flex flex-wrap gap-1.5">{(d.by_role || []).map((r: any, i: number) => <span key={r.role} className="rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ background: COLORS[i % COLORS.length] }}>{r.role}: {r.count}</span>)}</div>
        </div>
        <div className="card"><h3 className="h-section">Database rows by table (top 12)</h3>
          <div className="h-60"><ResponsiveContainer><BarChart data={tables} layout="vertical"><XAxis type="number" /><YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="value" fill="#0d9488" radius={4} /></BarChart></ResponsiveContainer></div>
        </div>
      </div>
      <div className="card"><h3 className="h-section">Recent security-relevant activity</h3>
        <div className="mt-2 space-y-1">{(d.recent_audit || []).map((a: any, i: number) => <div key={i} className="flex justify-between rounded-lg bg-slate-50 dark:bg-white/5 p-2 text-sm"><span><b>{a.action}</b> · {a.entity}</span><span className="text-xs text-slate-500">{a.at?.slice(0, 16).replace('T', ' ')}</span></div>)}</div></div>
    </div>
  );
}
