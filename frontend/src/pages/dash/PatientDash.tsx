import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth';
import { useLive } from '../../live';
import { Ecg, Loading, PriorityBadge, StatusBadge } from '../../components';

export default function PatientDash() {
  const { user } = useAuth();
  const { lastEvent } = useLive();
  const [d, setD] = useState<any>(null);
  const load = async () => { try { const { data } = await api.get('/api/patient/overview'); setD(data); } catch {} };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (lastEvent && ['queue_updated', 'appointment_updated', 'triage_completed'].includes(lastEvent.event)) load(); }, [lastEvent]);
  if (!d) return <Loading text="Loading your dashboard…" />;
  if (!d.linked) return <div className="card">👋 Welcome, {user?.full_name}! <p className="mt-1 text-sm text-slate-500">{d.hint}</p><Link to="/patients" className="btn-primary mt-3">Register my profile</Link></div>;

  const first = (user?.full_name || 'Friend').split(' ').slice(-1)[0];
  return (
    <div className="space-y-4">
      <div className="hero-panel relative overflow-hidden rounded-2xl p-6 text-white shadow-card">
        <div className="absolute inset-0 hero-grid" />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-100">👤 Patient Portal</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Welcome, {first} 🙏</h1>
          <Ecg className="mt-1 h-5 w-48 text-teal-100" />
          <p className="mt-1 text-sm text-teal-50/90">Your health journey, all in one friendly place.</p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="card card-hover">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">📅 Next Appointment</p>
          {d.upcoming ? (<><p className="mt-1 text-xl font-black">{d.upcoming.doctor || '—'}</p><p className="text-sm text-slate-500">{d.upcoming.dept} · {d.upcoming.date} · {d.upcoming.slot}</p><p className="mt-1"><StatusBadge value={d.upcoming.status} /></p></>)
            : <p className="mt-2 text-sm text-slate-500">No upcoming appointment. <Link to="/appointments" className="font-bold text-brand-600">Book one →</Link></p>}
        </div>
        <div className="card card-hover text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">⏳ Queue Position</p>
          {d.queue_position ? <p className="mt-1 text-5xl font-black text-brand-600">#{d.queue_position}</p> : <p className="mt-2 text-sm text-slate-500">Not in queue right now</p>}
          <p className="text-xs text-slate-500">{d.queue_total} patients in system queue</p>
        </div>
        <div className="card card-hover">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">🏥 Last Visit</p>
          {d.last_visit ? (<><p className="mt-1 text-xl font-black">{d.last_visit.date || '—'}</p><p className="text-sm text-slate-500">{d.last_visit.dept} · {d.last_visit.status}</p></>)
            : <p className="mt-2 text-sm text-slate-500">No visits yet</p>}
          <p className="mt-2 text-xs">🔔 {d.unread} unread notifications</p>
        </div>
      </div>
      {d.active_visits?.length > 0 && (
        <div className="card">
          <h3 className="h-section">My active visits</h3>
          <div className="mt-2 space-y-2">{d.active_visits.map((v: any) => (
            <div key={v.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 dark:bg-white/5 p-3">
              <div><b>Visit #{v.id}</b> · {v.dept} · {v.complaint}<div className="mt-1 flex gap-2"><PriorityBadge value={v.priority} /><StatusBadge value={v.status} /></div></div>
              <Link to="/visits" className="btn-ghost !py-1 text-xs">Track →</Link>
            </div>))}</div>
        </div>)}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[['/appointments', '📅', 'Book visit'], ['/assistant', '🤖', 'Health assistant'], ['/nutrition', '🥗', 'Nutrition'], ['/wellness', '💙', 'Wellness']].map(([to, icon, l]) => (
          <Link key={to} to={to} className="card card-hover text-center"><div className="text-3xl">{icon}</div><p className="mt-1 text-sm font-bold">{l}</p></Link>))}
      </div>
    </div>
  );
}
