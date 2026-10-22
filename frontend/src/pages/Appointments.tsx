import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { useLive } from '../live';
import { Empty, Loading } from '../components';

const STC: Record<string, string> = { requested: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', completed: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300', cancelled: 'bg-stone-200 text-stone-500', rescheduled: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' };

export default function Appointments() {
  const { user } = useAuth();
  const { lastEvent } = useLive();
  const [rows, setRows] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [depts, setDepts] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [fStatus, setFStatus] = useState('');
  const [fDate, setFDate] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);
  // booking form
  const [b, setB] = useState({ patient_id: '', doctor_id: '', department_id: '', date: new Date().toISOString().slice(0, 10), time_slot: '', reason: '' });
  const [slots, setSlots] = useState<any[]>([]);
  const [docSearch, setDocSearch] = useState('');
  const [patSearch, setPatSearch] = useState('');
  const staff = user?.role !== 'patient';

  const load = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (fStatus) params.status = fStatus;
      if (fDate) params.date = fDate;
      const [a, s] = await Promise.all([api.get('/api/appointments', { params }), api.get('/api/appointments/stats')]);
      setRows(a.data); setStats(s.data);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { api.get('/api/doctors').then((r) => setDocs(r.data)); api.get('/api/departments').then((r) => setDepts(r.data)); }, []);
  useEffect(() => { load(); }, [fStatus, fDate]);
  useEffect(() => { if (lastEvent?.event === 'appointment_updated') load(); }, [lastEvent]);
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(async () => {
      try { const { data } = await api.get('/api/patients', { params: { search: patSearch, limit: 10 } }); setPatients(data.items); } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [patSearch, show]);
  useEffect(() => {
    if (show && b.doctor_id && b.date) {
      api.get(`/api/doctors/${b.doctor_id}/slots`, { params: { date: b.date } }).then((r) => setSlots(r.data.slots || [])).catch(() => setSlots([]));
    } else setSlots([]);
  }, [b.doctor_id, b.date, show]);

  const book = async (e: any) => {
    e.preventDefault();
    if (!b.patient_id) { alert('Select a patient'); return; }
    try {
      await api.post('/api/appointments', { patient_id: Number(b.patient_id), doctor_id: b.doctor_id ? Number(b.doctor_id) : null, department_id: b.department_id ? Number(b.department_id) : null, date: b.date, time_slot: b.time_slot, reason: b.reason });
      setShow(false); setB({ ...b, time_slot: '', reason: '' }); load();
      alert('Appointment requested ✓');
    } catch (err: any) { alert(err?.response?.data?.detail || 'Booking failed'); }
  };
  const setStatus = async (id: number, status: string) => {
    try { await api.patch(`/api/appointments/${id}`, { status }); load(); } catch (err: any) { alert(err?.response?.data?.detail || 'Failed'); }
  };
  const cancel = async (id: number) => {
    if (!confirm('Cancel this appointment?')) return;
    try { await api.post(`/api/appointments/${id}/cancel`); load(); } catch (err: any) { alert(err?.response?.data?.detail || 'Failed'); }
  };

  const filteredDocs = docs.filter((d) => (!b.department_id || String(d.department_id) === b.department_id) && (!docSearch || d.full_name.toLowerCase().includes(docSearch.toLowerCase()) || d.specialization.toLowerCase().includes(docSearch.toLowerCase())));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Appointments</h1>
        <button onClick={() => setShow(true)} className="btn-primary">＋ Book appointment</button>
      </div>
      {stats && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[['Today', stats.today, '📅'], ['Upcoming', stats.upcoming, '⏭️'], ['Requested', stats.by_status.requested, '🆕'], ['Confirmed', stats.by_status.confirmed, '✅'], ['Completed', stats.by_status.completed, '🏁']].map(([t, v, i]) => (
            <div key={t as string} className="card !p-3"><p className="text-xs text-slate-500">{i} {t}</p><p className="text-2xl font-bold">{v as number}</p></div>))}
        </div>)}
      <div className="card flex flex-wrap gap-2">
        <select className="input max-w-[180px]" value={fStatus} onChange={(e) => setFStatus(e.target.value)}><option value="">All statuses</option>{['requested', 'confirmed', 'rejected', 'completed', 'cancelled', 'rescheduled'].map((s) => <option key={s} value={s}>{s}</option>)}</select>
        <input type="date" className="input max-w-[180px]" value={fDate} onChange={(e) => setFDate(e.target.value)} />
        {fDate && <button onClick={() => setFDate('')} className="btn-ghost">Clear date</button>}
      </div>
      {loading ? <Loading /> : rows.length === 0 ? <Empty text="No appointments found." /> : (
        <div className="card !p-0 overflow-x-auto"><table className="grid-table">
          <thead><tr><th>ID</th><th>Patient</th><th>Doctor</th><th>Date / Slot</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{rows.slice(0, 100).map((a) => (
            <tr key={a.id}>
              <td className="font-mono">#{a.id}</td>
              <td className="font-medium">{a.patient_name}<div className="text-xs text-slate-500">{a.patient_code}</div></td>
              <td>{a.doctor_name || '—'}<div className="text-xs text-slate-500">{a.department}</div></td>
              <td className="whitespace-nowrap">{a.date} · <b>{a.time_slot || '—'}</b></td>
              <td className="max-w-[160px] truncate">{a.reason}</td>
              <td><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STC[a.status]}`}>{a.status}</span></td>
              <td><div className="flex flex-wrap gap-1">
                {staff && a.status === 'requested' && <><button onClick={() => setStatus(a.id, 'confirmed')} className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-semibold text-white">Accept</button><button onClick={() => setStatus(a.id, 'rejected')} className="rounded-lg bg-red-600 px-2 py-1 text-xs font-semibold text-white">Reject</button></>}
                {staff && a.status === 'confirmed' && <button onClick={() => setStatus(a.id, 'completed')} className="rounded-lg bg-brand-600 px-2 py-1 text-xs font-semibold text-white">Complete</button>}
                {(staff || a.status === 'requested' || a.status === 'confirmed') && a.status !== 'completed' && a.status !== 'cancelled' && <button onClick={() => cancel(a.id)} className="rounded-lg bg-stone-500 px-2 py-1 text-xs font-semibold text-white">Cancel</button>}
              </div></td>
            </tr>))}</tbody>
        </table></div>)}

      {show && (
        <div className="fixed inset-0 z-30 grid place-items-center overflow-y-auto bg-black/50 p-4" onClick={() => setShow(false)}>
          <form onSubmit={book} onClick={(e) => e.stopPropagation()} className="card my-8 w-full max-w-2xl space-y-3">
            <h2 className="text-lg font-bold">Book appointment</h2>
            <div><label className="label">Patient * (search)</label>
              <input className="input" placeholder="Type name / ID / phone…" value={patSearch} onChange={(e) => setPatSearch(e.target.value)} />
              <select className="input mt-1" value={b.patient_id} onChange={(e) => setB({ ...b, patient_id: e.target.value })} required>
                <option value="">— Select patient —</option>{patients.map((p) => <option key={p.id} value={p.id}>{p.patient_code} — {p.full_name}</option>)}
              </select></div>
            <div className="grid gap-3 md:grid-cols-2">
              <div><label className="label">Department</label><select className="input" value={b.department_id} onChange={(e) => setB({ ...b, department_id: e.target.value, doctor_id: '' })}><option value="">— Any —</option>{depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
              <div><label className="label">Date</label><input type="date" className="input" value={b.date} onChange={(e) => setB({ ...b, date: e.target.value })} required /></div>
            </div>
            <div><label className="label">Doctor (search)</label>
              <input className="input" placeholder="Search doctor / specialization…" value={docSearch} onChange={(e) => setDocSearch(e.target.value)} />
              <select className="input mt-1" value={b.doctor_id} onChange={(e) => setB({ ...b, doctor_id: e.target.value })}>
                <option value="">— Any available —</option>{filteredDocs.slice(0, 60).map((d) => <option key={d.id} value={d.id}>{d.full_name} — {d.specialization} {d.available ? '' : '(off)'}</option>)}
              </select></div>
            {b.doctor_id && (
              <div><label className="label">Available slots {slots.length === 0 && '(none — doctor off this weekday or fully booked)'}</label>
                <div className="flex flex-wrap gap-1.5">{slots.map((s) => <button type="button" key={s.time} disabled={s.booked} onClick={() => setB({ ...b, time_slot: s.time })} className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${s.booked ? 'opacity-30 line-through' : b.time_slot === s.time ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 dark:border-slate-700'}`}>{s.time}</button>)}</div></div>)}
            {!b.doctor_id && <div><label className="label">Preferred time (optional)</label><input className="input" placeholder="e.g. 10:00" value={b.time_slot} onChange={(e) => setB({ ...b, time_slot: e.target.value })} /></div>}
            <div><label className="label">Reason</label><input className="input" value={b.reason} onChange={(e) => setB({ ...b, reason: e.target.value })} placeholder="e.g. Fever follow-up" /></div>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setShow(false)} className="btn-ghost">Cancel</button><button className="btn-primary">Request appointment</button></div>
          </form>
        </div>)}
    </div>
  );
}
