import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth';
import { useLive } from '../../live';
import { Ecg, Kpi, Loading, PriorityBadge, StatusBadge } from '../../components';

// ================= DOCTOR =================
export function DoctorDash() {
  const { user } = useAuth();
  const { lastEvent } = useLive();
  const [d, setD] = useState<any>(null);
  const load = async () => { try { const { data } = await api.get('/api/doctor/overview'); setD(data); } catch {} };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (lastEvent && ['queue_updated', 'triage_completed', 'emergency', 'lab_updated', 'appointment_updated'].includes(lastEvent.event)) load(); }, [lastEvent]);
  if (!d) return <Loading text="Loading doctor dashboard…" />;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><h1 className="text-2xl font-black tracking-tight">👨‍⚕️ Doctor Dashboard</h1><Ecg className="h-4 w-40 text-brand-600" /><p className="text-sm text-slate-500">{user?.full_name} · clinical workspace</p></div>
        <div className="flex gap-2"><Link to="/queue" className="btn-primary">Priority queue</Link><Link to="/lab" className="btn-ghost">🧪 Lab {d.lab_ready > 0 && `(${d.lab_ready} ready)`}</Link></div>
      </div>
      {(d.emergency > 0 || d.lab_ready > 0) && (
        <div className="rounded-2xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-3 text-sm font-semibold text-red-800 dark:text-red-200">
          🚨 {d.emergency} emergenc{d.emergency === 1 ? 'y' : 'ies'} waiting{d.lab_ready > 0 && ` · 🧪 ${d.lab_ready} lab report${d.lab_ready === 1 ? '' : 's'} ready for review`}
        </div>)}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi title="Today's patients" value={d.today_total} icon="🧑‍🤝‍🧑" />
        <Kpi title="Waiting" value={d.waiting} icon="⏳" />
        <Kpi title="Emergency" value={d.emergency} icon="🔴" />
        <Kpi title="Completed" value={d.completed_today} icon="✅" />
        <Kpi title="Appointments" value={d.appointments_today} icon="📅" sub={`${d.lab_pending} lab pending`} />
      </div>
      <div className="card !p-0 overflow-hidden">
        <div className="flex items-center justify-between p-4 pb-2"><h3 className="h-section">My priority queue</h3><Link to="/queue" className="text-sm font-bold text-brand-600">Open full queue →</Link></div>
        <div className="overflow-x-auto"><table className="grid-table">
          <thead><tr><th>Priority</th><th>Patient</th><th>Waiting</th><th>Department</th><th>Status</th></tr></thead>
          <tbody>{(d.queue || []).map((q: any) => <tr key={q.id} className={`pri-${q.priority}`}><td><PriorityBadge value={q.priority} /></td><td className="font-semibold">{q.patient}<div className="text-xs font-normal text-slate-500">{q.code}</div></td><td className="font-bold">{q.wait} min</td><td>{q.dept}</td><td><StatusBadge value={q.status} /></td></tr>)}</tbody>
        </table></div>
      </div>
    </div>
  );
}

// ================= NURSE =================
export function NurseDash() {
  const { user } = useAuth();
  const { lastEvent } = useLive();
  const [d, setD] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const load = async () => {
    try {
      const [a, b] = await Promise.all([api.get('/api/nurse/overview'), api.get('/api/tasks', { params: { status: 'pending' } })]);
      setD(a.data); setTasks(b.data.slice(0, 12));
    } catch {}
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (lastEvent && ['queue_updated', 'tasks_updated', 'triage_completed', 'patient_registered', 'emergency'].includes(lastEvent.event)) load(); }, [lastEvent]);
  const done = async (id: number) => { await api.patch(`/api/tasks/${id}`, { status: 'done' }); load(); };
  if (!d) return <Loading text="Loading nurse station…" />;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><h1 className="text-2xl font-black tracking-tight">👩‍⚕️ Nurse Station</h1><Ecg className="h-4 w-40 text-brand-600" /><p className="text-sm text-slate-500">{user?.full_name} · task-focused shift board</p></div>
        <div className="flex gap-2"><Link to="/triage" className="btn-primary">🩺 Triage intake</Link><Link to="/tasks" className="btn-ghost">💉 All tasks</Link></div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Kpi title="Assigned" value={d.assigned} icon="🧑‍🤝‍🧑" />
        <Kpi title="Waiting triage" value={d.waiting_triage} icon="⏳" />
        <Kpi title="Vitals pending" value={d.vitals_pending} icon="🌡️" />
        <Kpi title="Nursing tasks" value={d.tasks_open} icon="💉" />
        <Kpi title="High priority" value={d.high_priority} icon="🔴" />
        <Kpi title="Beds free" value={d.beds_available} icon="🛏️" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="flex items-center justify-between"><h3 className="h-section">✔️ Shift task list</h3><Link to="/tasks" className="text-sm font-bold text-brand-600">Manage →</Link></div>
          <div className="mt-2 space-y-1.5">{tasks.length === 0 && <p className="text-sm text-slate-500">All caught up! 🎉</p>}
            {tasks.map((t) => (
              <label key={t.id} className="flex cursor-pointer items-center gap-2 rounded-xl bg-slate-50 dark:bg-white/5 p-2.5 text-sm hover:bg-teal-50 dark:hover:bg-teal-900/20">
                <input type="checkbox" className="h-4 w-4 accent-teal-600" onChange={() => done(t.id)} />
                <span className="flex-1"><b>{t.title}</b><span className="ml-2 rounded bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 text-[10px]">{t.category}</span></span>
              </label>))}</div>
        </div>
        <div className="card">
          <h3 className="h-section">🚨 Needs triage now</h3>
          <div className="mt-2 space-y-1.5">{d.triage_waitlist?.length === 0 && <p className="text-sm text-slate-500">No one waiting for triage.</p>}
            {d.triage_waitlist?.map((v: any) => (
              <div key={v.id} className="flex items-center justify-between rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-2.5 text-sm">
                <span><b>Visit #{v.id}</b> · {v.complaint || '—'}</span>
                <Link to="/triage" className="rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-bold text-white">Triage →</Link>
              </div>))}</div>
        </div>
      </div>
    </div>
  );
}
