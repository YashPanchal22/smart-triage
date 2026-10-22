import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';

const ROLES = ['patient', 'doctor', 'nurse', 'triage', 'emergency', 'blood', 'pharmacy', 'lab', 'admin', 'superadmin'];

export default function Users() {
  const { user } = useAuth();
  const [tab, setTab] = useState('users');
  const [rows, setRows] = useState<any[]>([]);
  const [matrix, setMatrix] = useState<any>(null);
  const [fRole, setFRole] = useState('');
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ username: '', email: '', password: '', full_name: '', role: 'patient' });
  const isSuper = user?.role === 'superadmin';

  const load = async () => {
    try {
      const [a, m] = await Promise.all([api.get('/api/admin/users', { params: fRole ? { role: fRole } : {} }), api.get('/api/admin/permissions')]);
      setRows(a.data); setMatrix(m.data);
    } catch {}
  };
  useEffect(() => { load(); }, [fRole]);

  const create = async (e: any) => {
    e.preventDefault();
    try { await api.post('/api/admin/users', f); setShow(false); setF({ username: '', email: '', password: '', full_name: '', role: 'patient' }); load(); } catch (err: any) { alert(err?.response?.data?.detail || 'Failed'); }
  };
  const toggle = async (u: any) => {
    try { await api.patch(`/api/admin/users/${u.id}`, { is_active: !u.is_active }); load(); } catch (err: any) { alert(err?.response?.data?.detail || 'Failed'); }
  };
  const setRole = async (u: any, role: string) => {
    try { await api.patch(`/api/admin/users/${u.id}`, { role }); load(); } catch (err: any) { alert(err?.response?.data?.detail || 'Failed'); }
  };

  const cell = (v: any) => v === 1 ? <span className="font-bold text-emerald-600">✅</span> : v === 0 ? <span className="text-slate-300">❌</span> : <span className="text-[11px] font-semibold text-amber-600">{v}</span>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-black tracking-tight">👥 {isSuper ? 'User Management' : 'Users (view) '}</h1>
        <div className="flex gap-2">
          {['users', 'matrix'].map((t) => <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 text-sm font-bold ${tab === t ? 'bg-brand-600 text-white' : 'border border-slate-300 dark:border-slate-700'}`}>{t === 'users' ? '👥 Users' : '🔐 Roles & Permissions'}</button>)}
          {isSuper && tab === 'users' && <button onClick={() => setShow(true)} className="btn-primary">＋ Create user</button>}
        </div>
      </div>
      {!isSuper && <p className="rounded-xl bg-slate-100 dark:bg-white/5 p-2.5 text-xs">Hospital Admin has limited (read-only) access here. User creation, role changes, and disabling accounts require Super Admin.</p>}

      {tab === 'users' ? (<>
        <div className="card flex gap-2">
          <select className="input max-w-[200px]" value={fRole} onChange={(e) => setFRole(e.target.value)}><option value="">All roles</option>{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select>
          <span className="self-center text-sm text-slate-500">{rows.length} users · passwords are never displayed</span>
        </div>
        <div className="card !p-0 overflow-x-auto"><table className="grid-table">
          <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th>{isSuper && <th>Actions</th>}</tr></thead>
          <tbody>{rows.map((u) => (
            <tr key={u.id} className={!u.is_active ? 'opacity-50' : ''}>
              <td><b>{u.full_name}</b><div className="font-mono text-xs text-slate-500">@{u.username}</div></td>
              <td className="text-xs">{u.email}</td>
              <td>{isSuper ? <select className="input !w-36 !py-1 text-xs" value={u.role} onChange={(e) => setRole(u, e.target.value)}>{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select> : <b className="text-xs">{u.role}</b>}</td>
              <td><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{u.is_active ? 'active' : 'disabled'}</span></td>
              <td className="text-xs">{u.created_at?.slice(0, 10)}</td>
              {isSuper && <td><button onClick={() => toggle(u)} className={`rounded-lg px-2 py-1 text-xs font-bold text-white ${u.is_active ? 'bg-red-600' : 'bg-emerald-600'}`}>{u.is_active ? 'Disable' : 'Enable'}</button></td>}
            </tr>))}</tbody>
        </table></div>
      </>) : (
        <div className="card !p-0 overflow-x-auto">
          <div className="p-4 pb-2"><h3 className="h-section">Permission matrix (enforced on backend)</h3></div>
          <table className="grid-table"><thead><tr><th>Feature</th>{matrix?.roles.map((r: string) => <th key={r}>{r}</th>)}</tr></thead>
            <tbody>{matrix?.matrix.map((row: any[], i: number) => <tr key={i}><td className="font-semibold">{row[0]}</td>{row.slice(1).map((v, j) => <td key={j} className="text-center">{cell(v)}</td>)}</tr>)}</tbody></table>
        </div>)}

      {show && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/50 p-4" onClick={() => setShow(false)}>
          <form onSubmit={create} onClick={(e) => e.stopPropagation()} className="card w-full max-w-md space-y-3">
            <h2 className="font-bold">Create user</h2>
            <input required className="input" placeholder="Full name" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <input required className="input" placeholder="Username" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} />
              <input required type="email" className="input" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            </div>
            <input required type="password" className="input" placeholder="Password (min 6)" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
            <select className="input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setShow(false)} className="btn-ghost">Cancel</button><button className="btn-primary">Create</button></div>
          </form>
        </div>)}
    </div>
  );
}
