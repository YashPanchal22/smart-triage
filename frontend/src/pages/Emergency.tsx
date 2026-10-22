import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { useLive } from '../live';
import { Empty, PriorityBadge } from '../components';

const PIPE = ['requested', 'assigned', 'en_route', 'arrived', 'transferred', 'completed'];
const STLBL: Record<string, string> = { requested: 'Requested', assigned: 'Assigned', en_route: 'En Route', arrived: 'Arrived', transferred: 'Patient Transferred', completed: 'Completed', cancelled: 'Cancelled' };

export default function Emergency() {
  const { user } = useAuth();
  const { lastEvent } = useLive();
  const [rows, setRows] = useState<any[]>([]);
  const [ambs, setAmbs] = useState<any[]>([]);
  const [fStatus, setFStatus] = useState('');
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ patient_name: '', phone: '', emergency_type: 'medical', location: '', priority: 'emergency', notes: '' });
  const [sel, setSel] = useState<any>(null);
  const canManage = ['admin', 'emergency', 'triage', 'doctor'].includes(user?.role || '');

  const load = async () => {
    try {
      const [a, b] = await Promise.all([api.get('/api/emergency/requests', { params: fStatus ? { status: fStatus } : {} }), api.get('/api/emergency/ambulances')]);
      setRows(a.data); setAmbs(b.data);
      if (sel) { const upd = a.data.find((x: any) => x.id === sel.id); if (upd) setSel(upd); }
    } catch {}
  };
  useEffect(() => { load(); }, [fStatus]);
  useEffect(() => { if (lastEvent?.event === 'emergency_request') load(); }, [lastEvent]);

  const create = async (e: any) => {
    e.preventDefault();
    try { await api.post('/api/emergency/requests', f); setShow(false); setF({ patient_name: '', phone: '', emergency_type: 'medical', location: '', priority: 'emergency', notes: '' }); load(); } catch (err: any) { alert(err?.response?.data?.detail || 'Failed'); }
  };
  const advance = async (r: any) => {
    const i = PIPE.indexOf(r.status);
    if (i < 0 || i >= PIPE.length - 1) return;
    try { await api.patch(`/api/emergency/requests/${r.id}`, { status: PIPE[i + 1] }); load(); } catch (err: any) { alert(err?.response?.data?.detail || 'Failed'); }
  };
  const assignAmb = async (r: any, aid: string) => {
    if (!aid) return;
    try { await api.patch(`/api/emergency/requests/${r.id}`, { ambulance_id: Number(aid), status: r.status === 'requested' ? 'assigned' : r.status }); load(); } catch (err: any) { alert(err?.response?.data?.detail || 'Failed'); }
  };
  const ambStatus = async (id: number, status: string) => {
    try { await api.patch(`/api/emergency/ambulances/${id}`, { status }); load(); } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">🚑 Emergency Response</h1>
        <button onClick={() => setShow(true)} className="btn-danger">＋ New emergency request</button>
      </div>
      <p className="rounded-xl bg-slate-100 dark:bg-slate-800 p-3 text-xs text-slate-600 dark:text-slate-300">Demo coordination board — this system does not dispatch real ambulances. Real emergencies: call <b>108 / 112</b> (India) immediately.</p>
      <div className="card flex flex-wrap gap-2">
        <select className="input max-w-[200px]" value={fStatus} onChange={(e) => setFStatus(e.target.value)}><option value="">All statuses</option>{[...PIPE, 'cancelled'].map((s) => <option key={s} value={s}>{STLBL[s]}</option>)}</select>
        <span className="self-center text-sm text-slate-500">Active: {rows.filter((r) => !['completed', 'cancelled'].includes(r.status)).length} · Ambulances available: {ambs.filter((a) => a.status === 'available').length}/{ambs.length}</span>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-2">
          {rows.length === 0 ? <Empty text="No emergency requests." /> : rows.slice(0, 60).map((r) => (
            <div key={r.id} className={`card !p-3 ${r.status === 'requested' ? 'border-red-400 !border-2' : ''}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <b>#{r.id}</b> · {r.emergency_type} · 📍 {r.location || '—'} · {r.patient_name} {r.phone}
                  <div className="mt-1 flex items-center gap-2"><PriorityBadge value={r.priority} /><span className="rounded-full bg-slate-200 dark:bg-slate-800 px-2 py-0.5 text-xs font-bold">{STLBL[r.status]}</span>{r.ambulance && <span className="text-xs">🚑 {r.ambulance}</span>}</div>
                </div>
                <div className="flex flex-wrap gap-1">
                  <button onClick={() => setSel(r)} className="btn-ghost !py-1 text-xs">Timeline</button>
                  {canManage && PIPE.includes(r.status) && PIPE.indexOf(r.status) < PIPE.length - 1 && <button onClick={() => advance(r)} className="rounded-lg bg-brand-600 px-2 py-1 text-xs font-semibold text-white">→ {STLBL[PIPE[PIPE.indexOf(r.status) + 1]]}</button>}
                </div>
              </div>
              {canManage && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <select className="input max-w-[220px] !py-1 text-xs" value={r.ambulance_id || ''} onChange={(e) => assignAmb(r, e.target.value)}>
                    <option value="">Assign ambulance…</option>{ambs.map((a) => <option key={a.id} value={a.id}>{a.vehicle_no} ({a.status} · {a.location})</option>)}
                  </select>
                </div>)}
              <div className="mt-2 flex gap-1">{PIPE.map((s) => <div key={s} title={STLBL[s]} className={`h-1.5 flex-1 rounded-full ${PIPE.indexOf(s) <= PIPE.indexOf(r.status) ? 'bg-red-500' : 'bg-slate-200 dark:bg-slate-800'}`} />)}</div>
            </div>))}
        </div>
        <div className="space-y-3">
          <div className="card">
            <h3 className="font-bold">🚑 Ambulances</h3>
            <div className="mt-2 space-y-2">{ambs.map((a) => (
              <div key={a.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-2 text-sm">
                <b>{a.vehicle_no}</b> · {a.location}<div className="text-xs text-slate-500">{a.crew}</div>
                <div className="mt-1 flex gap-1">
                  {['available', 'on_trip', 'maintenance'].map((s) => <button key={s} disabled={!canManage} onClick={() => ambStatus(a.id, s)} className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${a.status === s ? (s === 'available' ? 'bg-emerald-600 text-white' : s === 'on_trip' ? 'bg-amber-600 text-white' : 'bg-stone-600 text-white') : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>{s}</button>)}
                </div>
              </div>))}</div>
          </div>
          {sel && (
            <div className="card">
              <div className="flex items-center justify-between"><h3 className="font-bold">Incident #{sel.id} timeline</h3><button onClick={() => setSel(null)} className="text-xs">✕</button></div>
              <div className="mt-2 space-y-2">{sel.timeline?.map((t: any, i: number) => <div key={i} className="border-l-2 border-brand-500 pl-2 text-sm"><b>{t.event}</b><div className="text-xs text-slate-500">{t.at?.slice(0, 19).replace('T', ' ')} · {t.by}</div></div>)}
                {(!sel.timeline || sel.timeline.length === 0) && <p className="text-sm text-slate-500">No events yet.</p>}</div>
              {sel.notes && <p className="mt-2 text-sm"><b>Notes:</b> {sel.notes}</p>}
            </div>)}
        </div>
      </div>
      {show && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/50 p-4" onClick={() => setShow(false)}>
          <form onSubmit={create} onClick={(e) => e.stopPropagation()} className="card w-full max-w-md space-y-3">
            <h2 className="font-bold">🚨 New emergency request</h2>
            <div className="grid grid-cols-2 gap-2">
              <input className="input" placeholder="Patient name" value={f.patient_name} onChange={(e) => setF({ ...f, patient_name: e.target.value })} />
              <input className="input" placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
              <select className="input" value={f.emergency_type} onChange={(e) => setF({ ...f, emergency_type: e.target.value })}>{['medical', 'accident', 'cardiac', 'maternity', 'pediatric', 'trauma'].map((t) => <option key={t}>{t}</option>)}</select>
              <select className="input" value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}><option value="emergency">🔴 Emergency</option><option value="urgent">🟠 Urgent</option></select>
            </div>
            <input required className="input" placeholder="Location / service area *" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />
            <textarea className="input" rows={2} placeholder="Notes…" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setShow(false)} className="btn-ghost">Cancel</button><button className="btn-danger">Raise request</button></div>
          </form>
        </div>)}
    </div>
  );
}
