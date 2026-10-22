import { useEffect, useState } from 'react';
import { api } from '../api';
import { useLive } from '../live';
import { Empty } from '../components';

// ---------- Nursing Tasks ----------
export function Tasks() {
  const { lastEvent } = useLive();
  const [rows, setRows] = useState<any[]>([]);
  const [fStatus, setFStatus] = useState('');
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ title: '', category: 'vitals', assigned_to: '', notes: '' });
  const load = async () => { try { const { data } = await api.get('/api/tasks', { params: fStatus ? { status: fStatus } : {} }); setRows(data); } catch {} };
  useEffect(() => { load(); }, [fStatus]);
  useEffect(() => { if (lastEvent?.event === 'tasks_updated') load(); }, [lastEvent]);
  const create = async (e: any) => {
    e.preventDefault();
    try { await api.post('/api/tasks', f); setShow(false); setF({ title: '', category: 'vitals', assigned_to: '', notes: '' }); load(); } catch (err: any) { alert(err?.response?.data?.detail || 'Failed'); }
  };
  const setStatus = async (id: number, status: string) => { await api.patch(`/api/tasks/${id}`, { status }); load(); };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-black tracking-tight">💉 Nursing Tasks</h1>
        <div className="flex gap-2">
          <select className="input max-w-[160px]" value={fStatus} onChange={(e) => setFStatus(e.target.value)}><option value="">All</option><option value="pending">Pending</option><option value="done">Done</option></select>
          <button onClick={() => setShow(true)} className="btn-primary">＋ Task</button>
        </div>
      </div>
      {rows.length === 0 ? <Empty text="No tasks." /> : (
        <div className="space-y-2">{rows.slice(0, 120).map((t) => (
          <div key={t.id} className={`card !p-3 flex flex-wrap items-center justify-between gap-2 ${t.status === 'done' ? 'opacity-60' : ''}`}>
            <div><b className={t.status === 'done' ? 'line-through' : ''}>{t.status === 'done' ? '☑' : '☐'} {t.title}</b>
              <div className="text-xs text-slate-500">{t.patient && `${t.patient} (${t.code}) · `}{t.category} · {t.assigned_to}</div></div>
            {t.status !== 'done' ? <button onClick={() => setStatus(t.id, 'done')} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">✓ Done</button>
              : <button onClick={() => setStatus(t.id, 'pending')} className="btn-ghost !py-1 text-xs">Reopen</button>}
          </div>))}</div>)}
      {show && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/50 p-4" onClick={() => setShow(false)}>
          <form onSubmit={create} onClick={(e) => e.stopPropagation()} className="card w-full max-w-md space-y-3">
            <h2 className="font-bold">New nursing task</h2>
            <input required className="input" placeholder="e.g. Check vital signs — P-00012" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
            <select className="input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{['vitals', 'prep', 'triage', 'bed', 'observation', 'medication', 'general'].map((c) => <option key={c}>{c}</option>)}</select>
            <input className="input" placeholder="Assign to (e.g. Nurse-3)" value={f.assigned_to} onChange={(e) => setF({ ...f, assigned_to: e.target.value })} />
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setShow(false)} className="btn-ghost">Cancel</button><button className="btn-primary">Create</button></div>
          </form>
        </div>)}
    </div>
  );
}

// ---------- Consultations ----------
export function Consultations() {
  const { lastEvent } = useLive();
  const [rows, setRows] = useState<any[]>([]);
  const load = async () => { try { const { data } = await api.get('/api/consultations'); setRows(data); } catch {} };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (lastEvent?.event === 'consultation_added') load(); }, [lastEvent]);
  const close = async (id: number) => { await api.patch(`/api/consultations/${id}`, { status: 'closed' }); load(); };
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black tracking-tight">🩺 Consultations</h1>
      <p className="text-sm text-slate-500">Human-authored clinical notes by doctors · add new notes from the queue's 📝 action.</p>
      {rows.length === 0 ? <Empty text="No consultations yet." /> : (
        <div className="space-y-2">{rows.slice(0, 100).map((c) => (
          <div key={c.id} className="card !p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><b>Visit #{c.visit_id}</b> · {c.patient} <span className="text-xs text-slate-500">({c.code})</span> · 👨‍⚕️ {c.doctor}<div className="text-xs text-slate-500">{c.at?.slice(0, 16).replace('T', ' ')} · <b>{c.status}</b></div></div>
              {c.status === 'open' && <button onClick={() => close(c.id)} className="btn-ghost !py-1 text-xs">Close</button>}
            </div>
            <p className="mt-1.5 rounded-xl bg-slate-50 dark:bg-white/5 p-2.5 text-sm">{c.notes}</p>
          </div>))}</div>)}
    </div>
  );
}

// ---------- Departments ----------
export function Departments() {
  const [rows, setRows] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ name: '', description: '', capacity: 20 });
  const load = async () => { try { const { data } = await api.get('/api/departments'); setRows(data); } catch {} };
  useEffect(() => { load(); }, []);
  const create = async (e: any) => {
    e.preventDefault();
    try { await api.post('/api/departments', { ...f, capacity: Number(f.capacity) }); setShow(false); load(); } catch (err: any) { alert(err?.response?.data?.detail || 'Failed'); }
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight">🏢 Departments</h1>
        <button onClick={() => setShow(true)} className="btn-primary">＋ Department</button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{rows.map((d) => (
        <div key={d.id} className="card card-hover"><p className="font-black">🏥 {d.name}</p><p className="text-sm text-slate-500">{d.description}</p><p className="mt-1 text-xs">Capacity: <b>{d.capacity}</b></p></div>))}</div>
      {show && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/50 p-4" onClick={() => setShow(false)}>
          <form onSubmit={create} onClick={(e) => e.stopPropagation()} className="card w-full max-w-md space-y-3">
            <h2 className="font-bold">New department</h2>
            <input required className="input" placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <input className="input" placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
            <input type="number" className="input" placeholder="Capacity" value={f.capacity} onChange={(e) => setF({ ...f, capacity: Number(e.target.value) })} />
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setShow(false)} className="btn-ghost">Cancel</button><button className="btn-primary">Create</button></div>
          </form>
        </div>)}
    </div>
  );
}
