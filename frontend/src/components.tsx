import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './auth';
import { useLive } from './live';
import { PRIORITY_META } from './api';
import React, { Component, ErrorInfo, useEffect, useRef, useState } from 'react';
import { api } from './api';

export const DISCLAIMER = 'Decision-support & education only — not a diagnosis. DEMONSTRATION SYSTEM — SYNTHETIC DATA.';

/** Animated ECG heartbeat line (brand motif) */
export function Ecg({ className = 'w-24 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 24" className={className} fill="none" aria-hidden>
      <path d="M0 12 H28 L34 12 L38 4 L44 20 L48 12 H58 L62 12 L65 8 L69 16 L72 12 H120"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
        className="ecg-path animate-ecg" />
    </svg>
  );
}

/** Brand logo: medical cross + pulse */
export function Logo({ size = 'h-10 w-10 text-xl' }: { size?: string }) {
  return (
    <span className={`relative grid ${size} place-items-center rounded-2xl text-white shadow-card overflow-hidden`}
      style={{ background: 'linear-gradient(135deg,#0d9488 0%,#0e7490 55%,#1e40af 100%)' }}>
      <span className="absolute inset-0 hero-grid opacity-60" />
      <span className="relative font-black">✚</span>
      <span className="absolute bottom-1 h-0.5 w-2/3 rounded-full bg-white/70 animate-pulseSoft" />
    </span>
  );
}

export function PriorityBadge({ value }: { value: string }) {
  const m = PRIORITY_META[value] || PRIORITY_META.routine;
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold shadow-sm ${m.badge}`}>{m.dot} {m.label}</span>;
}

export function StatusBadge({ value }: { value: string }) {
  const map: Record<string, string> = {
    waiting: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    called: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    under_assessment: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    registered: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    cancelled: 'bg-stone-200 text-stone-600',
  };
  const val = String(value || 'registered');
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${map[val] || map.registered}`}>{val.replace(/_/g, ' ')}</span>;
}

const KPI_GRAD: Record<string, string> = {
  '🧑‍🤝‍🧑': 'from-teal-500 to-cyan-600', '🔴': 'from-red-500 to-rose-600', '⏳': 'from-amber-500 to-orange-600',
  '⌛': 'from-violet-500 to-purple-600', '🟠': 'from-orange-500 to-amber-600', '🩺': 'from-cyan-500 to-blue-600',
  '✅': 'from-emerald-500 to-teal-600', '👨‍⚕️': 'from-sky-500 to-indigo-600', '📅': 'from-indigo-500 to-violet-600',
  '🩸': 'from-rose-500 to-red-600', '🚑': 'from-red-500 to-orange-500', '🛏️': 'from-teal-500 to-emerald-600',
  '🚐': 'from-cyan-500 to-teal-600', '❤️': 'from-pink-500 to-rose-600',
};

export function Kpi({ title, value, sub, icon }: { title: string; value: string | number; sub?: string; icon?: string }) {
  const g = (icon && KPI_GRAD[icon]) || 'from-teal-500 to-cyan-600';
  return (
    <div className="card card-hover !p-4 relative overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${g}`} />
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p>
        {icon && <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${g} text-lg shadow-card`}>{icon}</span>}
      </div>
      <p className="mt-1 text-[28px] font-black tracking-tight tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-teal-700/30 dark:border-teal-100/20 bg-teal-50/40 dark:bg-teal-950/20 p-10 text-center">
      <div className="text-4xl">🩺</div>
      <p className="mt-2 text-sm font-medium text-slate-500">{text}</p>
    </div>
  );
}

export function Loading({ text = 'Loading…' }: { text?: string }) {
  return (
    <div className="p-10 text-center">
      <Ecg className="mx-auto h-8 w-40 text-brand-600" />
      <p className="mt-2 text-sm text-slate-500 animate-pulse">{text}</p>
    </div>
  );
}

type Link = [string, string, string];

// Separate sidebar per role — each role gets its own workflow menu.
const ROLE_MENUS: Record<string, [string, Link[]][]> = {
  patient: [
    ['My Care', [
      ['/', '🏠', 'Dashboard'], ['/profile', '👤', 'My Profile'], ['/appointments', '📅', 'Appointments'], ['/visits', '🏥', 'My Visits'], ['/billing', '🧾', 'My Bills'],
    ]],
    ['Wellness', [
      ['/medicines', '💊', 'Medicine Info'], ['/assistant', '🤖', 'Health Assistant'], ['/nutrition', '🥗', 'Nutrition'], ['/wellness', '💙', 'Wellness'], ['/rural', '🌾', 'Rural Health'],
    ]],
    ['Account', [
      ['/notifications', '🔔', 'Notifications'], ['/preferences', '⚙️', 'Settings'],
    ]],
  ],
  doctor: [
    ['Clinical', [
      ['/', '🏠', 'Dashboard'], ['/patients', '👥', 'My Patients'], ['/queue', '🚨', 'Priority Queue'], ['/appointments', '📅', 'Appointments'], ['/consultations', '🩺', 'Consultations'],
    ]],
    ['Records', [
      ['/lab', '🧪', 'Lab Reports'], ['/medicines', '💊', 'Medication Info'], ['/analytics', '📊', 'My Analytics'],
    ]],
    ['Account', [
      ['/notifications', '🔔', 'Notifications'], ['/preferences', '⚙️', 'Settings'],
    ]],
  ],
  nurse: [
    ['Nurse Station', [
      ['/', '🏠', 'Dashboard'], ['/patients', '👥', 'Patients'], ['/triage', '🚨', 'Triage'], ['/queue', '📋', 'Patient Queue'], ['/tasks', '💉', 'Nursing Tasks'],
    ]],
    ['Care', [
      ['/consultations', '📝', 'Care Notes'], ['/resources', '🛏️', 'Bed Management'], ['/appointments', '📅', 'Appointments'], ['/lab', '🧪', 'Lab Status'], ['/reports', '📊', 'Nursing Reports'],
    ]],
    ['Account', [
      ['/notifications', '🔔', 'Alerts'], ['/preferences', '⚙️', 'Settings'],
    ]],
  ],
  emergency: [
    ['Response', [
      ['/', '🏠', 'Dashboard'], ['/emergency', '🚨', 'Active Emergencies'], ['/emergency', '🚑', 'Ambulances'], ['/queue', '👥', 'Emergency Patients'],
    ]],
    ['Resources', [
      ['/resources', '🏥', 'Hospital Capacity'], ['/notifications', '🔔', 'Alerts'],
    ]],
    ['Account', [
      ['/preferences', '⚙️', 'Settings'],
    ]],
  ],
  blood: [
    ['Blood Bank', [
      ['/', '🏠', 'Dashboard'], ['/blood', '🩸', 'Blood Inventory'], ['/blood', '👥', 'Donors'], ['/blood', '📋', 'Blood Requests'],
    ]],
    ['Account', [
      ['/notifications', '🔔', 'Alerts'], ['/preferences', '⚙️', 'Settings'],
    ]],
  ],
  pharmacy: [
    ['Dispensary', [
      ['/', '🏠', 'Dashboard'], ['/pharmacy', '💊', 'Inventory'], ['/pharmacy', '📋', 'Order Queue'], ['/medicines', '📖', 'Medicine Info'],
    ]],
    ['Account', [
      ['/notifications', '🔔', 'Notifications'], ['/preferences', '⚙️', 'Settings'],
    ]],
  ],
  lab: [
    ['Laboratory', [
      ['/', '🏠', 'Dashboard'], ['/lab', '🧪', 'Test Requests'], ['/lab', '🔬', 'Samples & Results'],
    ]],
    ['Account', [
      ['/notifications', '🔔', 'Notifications'], ['/preferences', '⚙️', 'Settings'],
    ]],
  ],
  admin: [
    ['Hospital', [
      ['/', '🏠', 'Dashboard'], ['/patients', '👥', 'Patients'], ['/doctors', '👨‍⚕️', 'Doctors'], ['/users', '👩‍⚕️', 'Staff & Nurses'], ['/departments', '🏢', 'Departments'], ['/appointments', '📅', 'Appointments'],
    ]],
    ['Operations', [
      ['/queue', '🚨', 'Triage & Queue'], ['/consultations', '🩺', 'Consultations'], ['/tasks', '💉', 'Nursing Tasks'], ['/emergency', '🚑', 'Emergency'], ['/blood', '🩸', 'Blood Bank'], ['/pharmacy', '💊', 'Pharmacy'], ['/lab', '🧪', 'Laboratory'], ['/resources', '🛏️', 'Resources'],
    ]],
    ['Insight', [
      ['/analytics', '📊', 'Analytics'], ['/risk', '🧬', 'Risk Lab'], ['/billing', '💰', 'Billing'], ['/reports', '📄', 'Reports & Audit'], ['/settings', '⚙️', 'Triage Rules'], ['/assistant', '🤖', 'AI Assistant'], ['/rural', '🌾', 'Rural'], ['/nutrition', '🥗', 'Nutrition'], ['/wellness', '💙', 'Wellness'],
    ]],
    ['Account', [
      ['/users', '🔐', 'Users (view)'], ['/system', '🖥️', 'System (view)'], ['/notifications', '🔔', 'Alerts'], ['/preferences', '⚙️', 'Settings'],
    ]],
  ],
  superadmin: [
    ['System', [
      ['/', '🏠', 'Dashboard'], ['/users', '👥', 'User Management'], ['/users', '🔐', 'Roles & Permissions'], ['/departments', '🏢', 'Departments'], ['/system', '⚙️', 'Configuration'], ['/system', '🗄️', 'Database'], ['/analytics', '📊', 'System Analytics'], ['/system', '🛡️', 'Security'], ['/reports', '📋', 'Audit Logs'],
    ]],
    ['Oversight', [
      ['/patients', '🧑‍⚕️', 'Patients'], ['/queue', '📋', 'Queues'], ['/emergency', '🚑', 'Emergency'], ['/blood', '🩸', 'Blood Bank'], ['/pharmacy', '💊', 'Pharmacy'], ['/lab', '🧪', 'Laboratory'],
    ]],
    ['Account', [
      ['/notifications', '🔔', 'System Alerts'], ['/preferences', '⚙️', 'Settings'],
    ]],
  ],
};
ROLE_MENUS.triage = ROLE_MENUS.nurse;

function GlobalSearch() {
  const [q, setQ] = useState('');
  const [res, setRes] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.length < 2) { setRes(null); return; }
    const t = setTimeout(async () => {
      try { const { data } = await api.get('/api/search', { params: { q } }); setRes(data); setOpen(true); } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    const h = (e: any) => { if (!box.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, []);

  const go = (path: string) => { setOpen(false); setQ(''); nav(path); };
  const groups: [string, string, (id: any) => string][] = [
    ['patients', '🧑‍⚕️ Patients', (id) => `/patients/${id}`],
    ['doctors', '👨‍⚕️ Doctors', () => '/doctors'],
    ['appointments', '📅 Appointments', () => '/appointments'],
    ['articles', '📖 Articles', () => '/assistant'],
    ['medicines', '💊 Medicines', () => '/medicines'],
    ['services', '🗺️ Services', () => '/rural'],
  ];

  return (
    <div ref={box} className="relative hidden md:block">
      <input className="input !w-52 !rounded-full !bg-slate-100/80 dark:!bg-white/5" placeholder="🔍 Search patients, medicines…" value={q} onChange={(e) => setQ(e.target.value)} />
      {open && res && (
        <div className="absolute right-0 z-40 mt-2 max-h-96 w-80 overflow-y-auto rounded-2xl border border-teal-900/10 dark:border-white/10 bg-white dark:bg-[#0b2233] p-2 shadow-card">
          {groups.map(([k, label, fn]) => res[k]?.length > 0 && (
            <div key={k} className="mb-1"><p className="px-2 py-1 text-[11px] font-bold uppercase text-slate-400">{label}</p>
              {res[k].slice(0, 5).map((r: any) => <button key={r.id} onClick={() => go(fn(r.id))} className="block w-full rounded-lg px-2 py-1 text-left text-sm hover:bg-teal-50 dark:hover:bg-teal-900/30">{r.label}</button>)}
            </div>))}
          {Object.values(res).every((v: any) => v.length === 0) && <p className="p-2 text-sm text-slate-500">No results.</p>}
        </div>)}
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { connected, lastEvent } = useLive();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark') || localStorage.getItem('triage_theme') === 'dark');
  const [unread, setUnread] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('triage_theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    (async () => {
      try { const { data } = await api.get('/api/settings'); setDark(data.theme === 'dark'); } catch {}
    })();
  }, []);

  const toggleDark = async () => {
    const next = !dark;
    setDark(next);
    try { await api.patch('/api/settings', { theme: next ? 'dark' : 'light' }); } catch {}
  };

  const fetchUnread = async () => {
    try {
      const { data } = await api.get('/api/notifications?unread_only=true');
      setUnread(data.length);
    } catch {}
  };
  useEffect(() => { fetchUnread(); }, []);
  useEffect(() => {
    if (!lastEvent) return;
    fetchUnread();
    if (lastEvent.event === 'emergency' || lastEvent.event === 'emergency_request') {
      const label = lastEvent.data?.visit?.patient_name || lastEvent.data?.request?.emergency_type || 'new case';
      setFlash(`🚨 EMERGENCY — ${label} needs immediate attention`);
      setTimeout(() => setFlash(null), 9000);
    }
  }, [lastEvent]);

  const role = user?.role || 'patient';
  const MENU = ROLE_MENUS[role] || ROLE_MENUS.patient;
  const flatLinks = (MENU || []).flatMap(([_, links]) => (Array.isArray(links) ? links : []));
  const seen = new Set<string>();
  const uniqFlat = flatLinks.filter((item) => {
    if (!Array.isArray(item) || typeof item[0] !== 'string') return false;
    const to = item[0];
    return seen.has(to) ? false : (seen.add(to), true);
  });
  const roleColor: Record<string, string> = { admin: 'bg-violet-600', superadmin: 'bg-indigo-900', doctor: 'bg-sky-600', nurse: 'bg-teal-600', triage: 'bg-teal-600', patient: 'bg-slate-500', blood: 'bg-rose-600', emergency: 'bg-red-600', pharmacy: 'bg-amber-600', lab: 'bg-purple-600' };

  return (
    <div className="min-h-screen">
      {flash && <div className="emergency-flash text-white text-center text-sm font-bold px-4 py-2" style={{ background: 'linear-gradient(90deg,#b91c1c,#ef4444,#b91c1c)' }}>{flash}</div>}
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-teal-900/10 dark:border-white/10 bg-white/85 dark:bg-[#061521]/85 backdrop-blur-lg">
        <div className="h-0.5" style={{ background: 'linear-gradient(90deg,#14b8a6,#0ea5e9,#6366f1,#14b8a6)' }} />
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-2.5">
          <NavLink to="/" className="flex items-center gap-2.5">
            <Logo />
            <span>
              <span className="block font-black tracking-tight text-[15px] sm:text-lg leading-tight">Smart Healthcare <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg,#0d9488,#0284c7)' }}>Ecosystem</span></span>
              <Ecg className="h-3.5 w-28 text-brand-600 -mt-0.5" />
            </span>
          </NavLink>
          <div className="flex items-center gap-1.5 text-sm">
            <GlobalSearch />
            <span className={`hidden md:inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${connected ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
              <span className="relative flex h-2 w-2">
                {connected && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
                <span className={`relative inline-flex h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              </span>
              {connected ? '● LIVE' : 'OFFLINE'}
            </span>
            <button onClick={toggleDark} className="btn-ghost !px-2.5 !rounded-full" title="Toggle theme">{dark ? '☀️' : '🌙'}</button>
            <NavLink to="/notifications" className="btn-ghost !px-2.5 !rounded-full relative">🔔{unread > 0 && <span className="absolute -top-1 -right-1 grid h-5 min-w-5 px-1 place-items-center rounded-full bg-red-600 text-[10px] font-bold text-white">{unread}</span>}</NavLink>
            <span className="hidden xl:flex items-center gap-1.5 text-xs text-slate-500">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 font-bold text-white">{user?.full_name?.[0] || '👤'}</span>
              <span className="leading-tight"><b className="block text-slate-700 dark:text-slate-200">{user?.full_name}</b><span className={`rounded px-1.5 py-0.5 text-[10px] font-bold text-white ${roleColor[role] || 'bg-slate-500'}`}>{role.toUpperCase()}</span></span>
            </span>
            <button onClick={logout} className="btn-ghost !px-3 !rounded-full">Logout</button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-4 px-4 py-4">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 md:block">
          <nav className="card !p-3 sticky top-[4.5rem] max-h-[calc(100vh-6rem)] overflow-y-auto">
            {MENU.map(([group, links]) => (
              <div key={group} className="mb-3">
                <p className="flex items-center gap-1.5 px-3 pb-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-teal-700/60 dark:text-teal-200/50">
                  <span className="h-1 w-1 rounded-full bg-teal-500" />{group}
                </p>
                <div className="space-y-0.5">
                  {links.map(([to, icon, label], i) => (
                    <NavLink key={`${to}-${i}`} to={to} end={to === '/'} className={({ isActive }) => `navlink ${isActive ? 'active' : ''}`}>
                      <span className="text-base">{icon}</span> {(label === 'Alerts' || label === 'Notifications') && unread ? `${label} (${unread})` : label}
                    </NavLink>))}
                </div>
              </div>))}
            <button onClick={logout} className="navlink w-full !text-red-600 dark:!text-red-400 hover:!bg-red-50 dark:hover:!bg-red-950/40"><span className="text-base">🚪</span> Logout</button>
            <div className="rounded-xl p-3 text-[10px] leading-snug text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#0f766e,#1e40af)' }}>
              <div className="absolute inset-0 hero-grid opacity-50" />
              <p className="relative font-semibold">⚠️ {DISCLAIMER}</p>
              <Ecg className="relative mt-1.5 h-4 w-full text-white/80" />
            </div>
          </nav>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
          <nav className="mb-3 flex gap-1.5 overflow-x-auto md:hidden pb-1">
            {uniqFlat.map(([to, icon, label]) => (
              <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold shadow-sm ${isActive ? 'text-white border-transparent' : 'border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-white/5'}`}
                style={({ isActive }) => isActive ? { background: 'linear-gradient(135deg,#0d9488,#0e7490)' } : undefined}>{icon} {label}</NavLink>
            ))}
          </nav>
          {children}
          <footer className="mt-6 flex items-center justify-center gap-2 pb-4 text-[11px] text-slate-400">
            <Ecg className="h-3 w-16 text-teal-600/50" />
            Smart Healthcare Ecosystem · Synthetic demo · Decision-support only
            <Ecg className="h-3 w-16 text-teal-600/50" />
          </footer>
        </main>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('ErrorBoundary captured render exception:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
          <div className="card w-full max-w-lg text-center !p-8 shadow-xl">
            <div className="text-4xl mb-3">🩺</div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Command Center Recovered</h2>
            <p className="text-sm text-slate-500 mb-6">
              An unexpected render issue was safely caught. The application is running in zero-error resilient mode.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { this.setState({ hasError: false }); window.location.hash = '#/'; window.location.reload(); }} className="btn-primary">
                Return to Dashboard
              </button>
              <button onClick={() => { localStorage.clear(); window.location.hash = '#/login'; window.location.reload(); }} className="btn-ghost">
                Reset Demo Session
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

