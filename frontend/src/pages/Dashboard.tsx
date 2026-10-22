import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useLive } from '../live';
import { Ecg, Kpi, Loading, PriorityBadge, StatusBadge } from '../components';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, CartesianGrid, Legend } from 'recharts';

const COLORS = ['#dc2626', '#f97316', '#eab308', '#10b981'];

export default function Dashboard() {
  const [ov, setOv] = useState<any>(null);
  const [dist, setDist] = useState<any>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [eco, setEco] = useState<any>(null);
  const { lastEvent, connected } = useLive();

  const load = async () => {
    try {
      const [a, b, c, d] = await Promise.all([api.get('/api/analytics/overview'), api.get('/api/analytics/distributions'), api.get('/api/queue'), api.get('/api/analytics/ecosystem')]);
      setOv(a.data); setDist(b.data); setQueue(c.data.slice(0, 8)); setEco(d.data);
    } catch {}
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (lastEvent && ['queue_updated', 'triage_completed', 'emergency', 'emergency_request', 'patient_registered', 'appointment_updated', 'blood_updated'].includes(lastEvent.event)) load(); }, [lastEvent]);
  if (!ov || !dist) return <Loading text="Loading command center…" />;

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const tips = ['🩺 Triage tip: abnormal vitals auto-escalate priority — always verify manually', '🩸 Low stock alert threshold: under 5 units per blood group', '🚑 Emergency pipeline: requested → assigned → en route → arrived → transferred', '🤖 AI Assistant answers in English, हिंदी and ગુજરાતી', '📅 Double-booking is blocked automatically per doctor slot', '💙 Crisis support: Tele-MANAS 14416 (24×7)'];

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="hero-panel relative overflow-hidden rounded-2xl p-5 sm:p-6 text-white shadow-card">
        <div className="absolute inset-0 hero-grid" />
        <div className="absolute -right-16 -bottom-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-100/90">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} {!connected && '· reconnecting…'}</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight">{greet}, Command Center ✚</h1>
            <Ecg className="mt-1 h-5 w-48 text-teal-100" />
            <p className="mt-1 text-sm text-teal-50/90">{ov.total_today} patients today · {ov.waiting} waiting · {ov.by_priority_today.emergency} emergencies · avg wait {ov.avg_wait_today} min</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/triage" className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-teal-800 shadow hover:bg-teal-50 transition">＋ New triage</Link>
            <Link to="/queue" className="rounded-xl border border-white/40 bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur hover:bg-white/20 transition">📋 Live queue</Link>
            <Link to="/emergency" className="rounded-xl bg-red-500/90 px-4 py-2 text-sm font-bold shadow hover:bg-red-500 transition">🚨 Emergency</Link>
          </div>
        </div>
      </div>
      {/* Tips ticker */}
      <div className="ticker-mask overflow-hidden rounded-xl border border-teal-900/10 dark:border-white/10 bg-white/70 dark:bg-white/5 py-2">
        <div className="flex w-max gap-8 whitespace-nowrap px-4 text-xs font-medium text-teal-900/80 dark:text-teal-100/80 animate-ticker">
          {[...tips, ...tips].map((t, i) => <span key={i}>{t}</span>)}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi title="Total patients today" value={ov.total_today} icon="🧑‍🤝‍🧑" sub="synthetic demo data" />
        <Kpi title="Emergency" value={ov.by_priority_today.emergency} icon="🔴" />
        <Kpi title="Waiting" value={ov.waiting} icon="⏳" />
        <Kpi title="Avg wait" value={`${ov.avg_wait_today} min`} icon="⌛" sub={`median ${ov.waiting_stats_30d.median} · max ${ov.waiting_stats_30d.max}`} />
        <Kpi title="Urgent" value={ov.by_priority_today.urgent} icon="🟠" />
        <Kpi title="Under assessment" value={ov.under_assessment} icon="🩺" />
        <Kpi title="Completed today" value={ov.completed_today} icon="✅" />
        <Kpi title="Doctors available" value={ov.doctors_available} icon="👨‍⚕️" />
      </div>
      {eco && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <Kpi title="Appointments today" value={eco.appointments_today} icon="📅" />
          <Kpi title="Blood units" value={eco.blood_units} icon="🩸" sub={`${eco.blood_open_requests} open requests`} />
          <Kpi title="Active emergencies" value={eco.emergencies_active} icon="🚑" />
          <Kpi title="Bed utilization" value={`${eco.bed_utilization}%`} icon="🛏️" sub={`${eco.beds_occupied}/${eco.beds_total}`} />
          <Kpi title="Ambulances free" value={eco.ambulances_available} icon="🚐" />
          <Kpi title="Donors" value={eco.donors} icon="❤️" />
        </div>)}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h3 className="font-bold">Patient Arrival Trend (14 days)</h3>
          <div className="h-56"><ResponsiveContainer><LineChart data={dist.daily}><CartesianGrid strokeDasharray="3 3" opacity={.3} /><XAxis dataKey="date" tick={{ fontSize: 10 }} interval={3} /><YAxis /><Tooltip /><Line type="monotone" dataKey="count" stroke="#0d9488" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div>
        </div>
        <div className="card">
          <h3 className="font-bold">Priority Distribution (30 days)</h3>
          <div className="h-56"><ResponsiveContainer><PieChart><Pie data={dist.by_priority} dataKey="value" nameKey="name" outerRadius={80} label>{dist.by_priority.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % 4]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>
        </div>
        <div className="card">
          <h3 className="font-bold">Hourly Arrivals (today)</h3>
          <div className="h-56"><ResponsiveContainer><BarChart data={dist.hourly}><XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={2} /><YAxis /><Tooltip /><Bar dataKey="count" fill="#0d9488" radius={4} /></BarChart></ResponsiveContainer></div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between"><h3 className="font-bold">Live Queue (top 8)</h3><Link to="/queue" className="text-sm font-semibold text-brand-600">Open queue →</Link></div>
          <div className="mt-2 overflow-x-auto"><table className="grid-table">
            <thead><tr><th>Priority</th><th>Patient</th><th>Wait</th><th>Dept</th><th>Status</th></tr></thead>
            <tbody>{queue.map((q) => <tr key={q.id}><td><PriorityBadge value={q.priority} /></td><td className="font-medium">{q.patient_name}<div className="text-xs text-slate-500">{q.patient_code}</div></td><td>{q.waiting_live_min} min</td><td>{q.department}</td><td><StatusBadge value={q.status} /></td></tr>)}</tbody>
          </table></div>
        </div>
      </div>
    </div>
  );
}
