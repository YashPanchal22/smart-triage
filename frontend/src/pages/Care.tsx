import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { Loading, PriorityBadge, StatusBadge } from '../components';

// ---------- My Profile ----------
export function Profile() {
  const { user } = useAuth();
  const [me, setMe] = useState<any>(null);
  const [mine, setMine] = useState<any[]>([]);
  useEffect(() => {
    api.get('/api/auth/me').then((r) => setMe(r.data)).catch(() => {});
    api.get('/api/patients', { params: { limit: 5 } }).then((r) => setMine(r.data.items || [])).catch(() => {});
  }, []);
  if (!me) return <Loading />;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black tracking-tight">👤 My Profile</h1>
      <div className="card flex items-center gap-4">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-2xl font-black text-white">{me.full_name?.[0]}</span>
        <div><p className="text-xl font-black">{me.full_name}</p><p className="text-sm text-slate-500">@{me.username} · {me.email}</p><span className="mt-1 inline-block rounded bg-slate-200 dark:bg-slate-800 px-2 py-0.5 text-xs font-bold">{me.role}</span></div>
      </div>
      <div className="card">
        <h3 className="h-section">Linked patient records</h3>
        {mine.length === 0 ? <p className="mt-2 text-sm text-slate-500">No linked patient profile. <Link to="/patients" className="font-bold text-brand-600">Register →</Link></p> : (
          <div className="mt-2 space-y-2">{mine.map((p) => <Link key={p.id} to={`/patients/${p.id}`} className="block rounded-xl bg-slate-50 dark:bg-white/5 p-3 hover:bg-teal-50"><b>{p.patient_code}</b> · {p.full_name} · {p.age}y · {p.phone}</Link>)}</div>)}
      </div>
    </div>
  );
}

// ---------- My Visits ----------
export function MyVisits() {
  const [d, setD] = useState<any>(null);
  const [lab, setLab] = useState<any[]>([]);
  useEffect(() => {
    api.get('/api/patient/overview').then((r) => setD(r.data)).catch(() => {});
    api.get('/api/lab/orders').then((r) => setLab(r.data)).catch(() => {});
  }, []);
  if (!d) return <Loading />;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black tracking-tight">🏥 My Visits & Triage Status</h1>
      {!d.linked ? <div className="card">{d.hint}</div> : (<>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="card text-center"><p className="text-xs font-bold uppercase text-slate-500">Queue position</p><p className="text-4xl font-black text-brand-600">{d.queue_position ? `#${d.queue_position}` : '—'}</p><p className="text-xs text-slate-500">of {d.queue_total} in queue</p></div>
          <div className="card"><p className="text-xs font-bold uppercase text-slate-500">Next appointment</p>{d.upcoming ? <><p className="font-black">{d.upcoming.doctor}</p><p className="text-sm text-slate-500">{d.upcoming.date} · {d.upcoming.slot}</p></> : <p className="text-sm text-slate-500">None scheduled</p>}</div>
          <div className="card"><p className="text-xs font-bold uppercase text-slate-500">Last visit</p>{d.last_visit ? <><p className="font-black">{d.last_visit.date}</p><p className="text-sm text-slate-500">{d.last_visit.dept}</p></> : <p className="text-sm text-slate-500">—</p>}</div>
        </div>
        <div className="card">
          <h3 className="h-section">Active visits</h3>
          <div className="mt-2 space-y-2">{(d.active_visits || []).map((v: any) => <div key={v.id} className="rounded-xl bg-slate-50 dark:bg-white/5 p-3"><b>Visit #{v.id}</b> · {v.dept} · {v.complaint}<div className="mt-1 flex gap-2"><PriorityBadge value={v.priority} /><StatusBadge value={v.status} /></div></div>)}
            {(!d.active_visits || d.active_visits.length === 0) && <p className="text-sm text-slate-500">No active visits.</p>}</div>
        </div>
        <div className="card">
          <h3 className="h-section">My lab results (released)</h3>
          <div className="mt-2 space-y-2">{lab.filter((o: any) => o.result).map((o: any) => <div key={o.id} className="rounded-xl bg-slate-50 dark:bg-white/5 p-3 text-sm"><b>{o.test}</b> · {o.at?.slice(0, 10)}<p className="mt-1">{o.result.text}</p></div>)}
            {lab.filter((o: any) => o.result).length === 0 && <p className="text-sm text-slate-500">No released results yet.</p>}</div>
        </div>
      </>)}
    </div>
  );
}

// ---------- Preferences ----------
export function Preferences() {
  const [s, setS] = useState({ theme: 'light', language: 'en' });
  const [msg, setMsg] = useState('');
  useEffect(() => { api.get('/api/settings').then((r) => setS(r.data)).catch(() => {}); }, []);
  const save = async () => {
    await api.patch('/api/settings', s);
    document.documentElement.classList.toggle('dark', s.theme === 'dark');
    localStorage.setItem('triage_theme', s.theme);
    setMsg('Saved ✓');
    setTimeout(() => setMsg(''), 2000);
  };
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black tracking-tight">⚙️ Settings</h1>
      <div className="card max-w-md space-y-3">
        <div><label className="label">Theme</label><select className="input" value={s.theme} onChange={(e) => setS({ ...s, theme: e.target.value })}><option value="light">☀️ Light clinical</option><option value="dark">🌙 Dark command-center</option></select></div>
        <div><label className="label">Preferred language</label><select className="input" value={s.language} onChange={(e) => setS({ ...s, language: e.target.value })}><option value="en">English</option><option value="hi">हिंदी</option><option value="gu">ગુજરાતી</option></select></div>
        <button onClick={save} className="btn-primary">Save preferences</button>
        {msg && <p className="text-sm text-emerald-600">{msg}</p>}
        <p className="text-xs text-slate-500">UI preferences are stored per-user in the backend database; healthcare data always stays in the secured backend.</p>
      </div>
    </div>
  );
}
