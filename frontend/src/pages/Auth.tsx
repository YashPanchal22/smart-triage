import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { api, PRIORITY_META } from '../api';
import { DISCLAIMER, Ecg, Logo } from '../components';

const DEMO = [['admin', 'admin123', '👨‍💼', 'admin'], ['superadmin', 'super123', '🛡️', 'superadmin'], ['doctor', 'doctor123', '👨‍⚕️', 'doctor'], ['nurse', 'nurse123', '👩‍⚕️', 'nurse'], ['triage', 'triage123', '🩺', 'triage'], ['patient', 'patient123', '🧑', 'patient'], ['blood', 'blood123', '🩸', 'blood'], ['emergency', 'emergency123', '🚑', 'emergency'], ['pharmacy', 'pharmacy123', '💊', 'pharmacy'], ['lab', 'lab123', '🧪', 'lab']];
const ROLES = ['admin', 'superadmin', 'doctor', 'nurse', 'triage', 'patient', 'blood', 'emergency', 'pharmacy', 'lab'];

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [username, setU] = useState('admin');
  const [password, setP] = useState('admin123');
  const [role, setRole] = useState('admin');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const go = async (e?: any) => {
    e?.preventDefault(); setErr(''); setBusy(true);
    try {
      await login(username, password);
      const u = JSON.parse(localStorage.getItem('triage_user') || '{}');
      if (role && u.role !== role) {
        localStorage.removeItem('triage_token'); localStorage.removeItem('triage_user');
        setErr(`This account is registered as "${u.role}" — please select that role (or ask Super Admin).`);
        return;
      }
      nav('/');
    } catch (e: any) { setErr(e?.response?.data?.detail || 'Login failed'); }
    finally { setBusy(false); }
  };
  const quick = (u: string, p: string, r: string) => { setU(u); setP(p); setRole(r); };
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Hero panel */}
      <div className="hero-panel relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:flex">
        <div className="absolute inset-0 hero-grid" />
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-2xl animate-floaty" />
        <div className="absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <Logo size="h-12 w-12 text-2xl" />
          <div>
            <p className="text-xl font-black tracking-tight">Smart Healthcare Ecosystem</p>
            <Ecg className="h-4 w-40 text-teal-100" />
          </div>
        </div>
        <div className="relative">
          <h2 className="text-4xl font-black leading-tight tracking-tight">One platform.<br />Every heartbeat<br />of the hospital.</h2>
          <p className="mt-3 max-w-md text-teal-50/90">Triage · Appointments · Blood Bank · Emergency · AI Assistant · Analytics — unified decision-support for modern care teams.</p>
          <div className="mt-6 grid max-w-md grid-cols-3 gap-2 text-center">
            {[['1,000+', 'Patients'], ['100', 'Doctors'], ['● LIVE', 'Real-time']].map(([v, l]) => (
              <div key={l} className="rounded-2xl border border-white/25 bg-white/10 p-3 backdrop-blur"><p className="text-lg font-black">{v}</p><p className="text-[11px] uppercase tracking-wider text-teal-100">{l}</p></div>))}
          </div>
          <div className="mt-4 flex gap-2 text-xs font-bold">
            {Object.entries(PRIORITY_META).map(([k, m]) => <span key={k} className="rounded-full border border-white/25 bg-white/10 px-2.5 py-1">{m.dot} {m.label}</span>)}
          </div>
        </div>
        <p className="relative text-[11px] text-teal-100/80">⚠️ {DISCLAIMER} Emergency: 108 / 112 (India).</p>
      </div>
      {/* Form panel */}
      <div className="grid place-items-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-5 flex items-center gap-3 lg:hidden">
            <Logo />
            <div><h1 className="text-xl font-black tracking-tight">Smart Healthcare Ecosystem</h1><Ecg className="h-3.5 w-32 text-brand-600" /></div>
          </div>
          <h1 className="hidden text-3xl font-black tracking-tight lg:block">Welcome back<span className="text-brand-600">.</span></h1>
          <p className="mb-5 hidden text-sm text-slate-500 lg:block">Sign in to the hospital command center.</p>
          <form onSubmit={go} className="card space-y-4 !p-6">
            <div><label className="label">Username</label><input className="input !py-2.5" value={username} onChange={(e) => setU(e.target.value)} placeholder="e.g. admin" /></div>
            <div><label className="label">Password</label><input type="password" className="input !py-2.5" value={password} onChange={(e) => setP(e.target.value)} placeholder="••••••••" /></div>
            <div><label className="label">Login as role</label>
              <select className="input !py-2.5" value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLES.map((r) => <option key={r} value={r}>{r === 'superadmin' ? '🛡️ Super Admin' : r[0].toUpperCase() + r.slice(1)}</option>)}
              </select>
              <p className="mt-1 text-[11px] text-slate-400">Must match your account's registered role.</p>
            </div>
            {err && <p className="rounded-xl bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-800 p-2.5 text-sm font-medium text-red-700 dark:text-red-300">{err}</p>}
            <button className="btn-primary w-full !py-2.5 !text-base">{busy ? 'Signing in…' : 'Sign in →'}</button>
            <div>
              <p className="label !mb-2">⚡ One-click demo accounts (synthetic data)</p>
              <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
                {DEMO.map(([u, p, icon, r]) => (
                  <button key={u} type="button" onClick={() => quick(u, p, r)} className={`rounded-xl border px-1 py-2 transition ${username === u ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-200 shadow-glow' : 'border-slate-200 dark:border-slate-700 hover:border-brand-400 hover:bg-teal-50 dark:hover:bg-teal-900/20'}`}>{icon} {u}</button>
                ))}
              </div>
            </div>
            <p className="text-center text-sm text-slate-500">No account? <Link to="/register" className="font-bold text-brand-600">Create one</Link></p>
          </form>
          <p className="mt-3 text-center text-[11px] text-slate-400">If this is a real medical emergency, call <b>108 / 112</b> or visit your nearest emergency department.</p>
        </div>
      </div>
    </div>
  );
}

export function Register() {
  const nav = useNavigate();
  const [f, setF] = useState({ username: '', email: '', password: '', full_name: '', role: 'patient' });
  const [err, setErr] = useState('');
  const set = (k: string, v: string) => setF({ ...f, [k]: v });
  const go = async (e: any) => {
    e.preventDefault(); setErr('');
    try {
      const { data } = await api.post('/api/auth/register', f);
      localStorage.setItem('triage_token', data.access_token);
      localStorage.setItem('triage_user', JSON.stringify(data.user));
      nav('/');
    } catch (e: any) { setErr(e?.response?.data?.detail || 'Registration failed'); }
  };
  return (
    <div className="grid min-h-screen place-items-center px-4 py-8">
      <form onSubmit={go} className="card w-full max-w-md space-y-3">
        <h1 className="text-xl font-bold">Create account</h1>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Full name</label><input className="input" required value={f.full_name} onChange={(e) => set('full_name', e.target.value)} /></div>
          <div><label className="label">Role</label><select className="input" value={f.role} onChange={(e) => set('role', e.target.value)}><option value="patient">Patient</option><option value="triage">Triage Staff</option><option value="nurse">Nurse</option><option value="doctor">Doctor</option><option value="blood">Blood Bank Staff</option><option value="emergency">Emergency Staff</option><option value="pharmacy">Pharmacy Staff</option><option value="lab">Lab Staff</option></select></div>
        </div>
        <div><label className="label">Username</label><input className="input" required value={f.username} onChange={(e) => set('username', e.target.value)} /></div>
        <div><label className="label">Email</label><input type="email" className="input" required value={f.email} onChange={(e) => set('email', e.target.value)} /></div>
        <div><label className="label">Password (min 6)</label><input type="password" className="input" required value={f.password} onChange={(e) => set('password', e.target.value)} /></div>
        {err && <p className="rounded-lg bg-red-100 p-2 text-sm text-red-700">{err}</p>}
        <button className="btn-primary w-full">Register</button>
        <p className="text-center text-sm"><Link to="/login" className="font-semibold text-brand-600">Back to login</Link></p>
      </form>
    </div>
  );
}
