import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { useLive } from '../live';
import { Empty, PriorityBadge } from '../components';

const FLOW = ['requested', 'sample_collected', 'processing', 'completed', 'reviewed'];
const LBL: Record<string, string> = { requested: 'Requested', sample_collected: 'Sample collected', processing: 'Processing', completed: 'Completed', reviewed: 'Reviewed ✓', cancelled: 'Cancelled' };

export default function Lab() {
  const { user } = useAuth();
  const { lastEvent } = useLive();
  const [rows, setRows] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<string[]>([]);
  const [fStatus, setFStatus] = useState('');
  const [show, setShow] = useState(false);
  const [resFor, setResFor] = useState<any>(null);
  const [resText, setResText] = useState('');
  const [patSearch, setPatSearch] = useState('');
  const [patients, setPatients] = useState<any[]>([]);
  const [of, setOf] = useState({ patient_id: '', test_name: 'CBC (Complete Blood Count)', priority: 'routine', notes: '' });
  const isLab = ['lab', 'admin', 'superadmin'].includes(user?.role || '');
  const canOrder = ['doctor', 'admin', 'superadmin', 'nurse', 'triage'].includes(user?.role || '');

  const load = async () => {
    try {
      const [a, c] = await Promise.all([api.get('/api/lab/orders', { params: fStatus ? { status: fStatus } : {} }), api.get('/api/lab/catalog')]);
      setRows(a.data); setCatalog(c.data);
    } catch {}
  };
  useEffect(() => { load(); }, [fStatus]);
  useEffect(() => { if (lastEvent?.event === 'lab_updated') load(); }, [lastEvent]);
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(async () => { try { const { data } = await api.get('/api/patients', { params: { search: patSearch, limit: 10 } }); setPatients(data.items); } catch {} }, 300);
    return () => clearTimeout(t);
  }, [patSearch, show]);

  const order = async (e: any) => {
    e.preventDefault();
    try { await api.post('/api/lab/orders', { ...of, patient_id: Number(of.patient_id) }); setShow(false); load(); } catch (err: any) { alert(err?.response?.data?.detail || 'Failed'); }
  };
  const advance = async (o: any) => {
    const i = FLOW.indexOf(o.status);
    if (i < 0 || i >= 3) return;
    await api.patch(`/api/lab/orders/${o.id}`, { status: FLOW[i + 1] }); load();
  };
  const saveResult = async () => {
    try { await api.post(`/api/lab/orders/${resFor.id}/result`, { result_text: resText }); setResFor(null); setResText(''); load(); } catch (err: any) { alert(err?.response?.data?.detail || 'Failed'); }
  };
  const review = async (id: number) => { await api.post(`/api/lab/orders/${id}/review`); load(); };
  const upload = async (id: number, file: File | undefined) => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try { await api.post(`/api/lab/results/${id}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }); load(); alert('Report uploaded ✓'); } catch (err: any) { alert(err?.response?.data?.detail || 'Upload failed — save result first'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-black tracking-tight">🧪 Laboratory</h1>
        <div className="flex gap-2">
          <select className="input max-w-[190px]" value={fStatus} onChange={(e) => setFStatus(e.target.value)}><option value="">All statuses</option>{[...FLOW, 'cancelled'].map((s) => <option key={s} value={s}>{LBL[s]}</option>)}</select>
          {canOrder && <button onClick={() => setShow(true)} className="btn-primary">＋ Request test</button>}
        </div>
      </div>
      <p className="rounded-xl bg-slate-100 dark:bg-white/5 p-2.5 text-xs text-slate-600 dark:text-slate-300">Flow: Doctor requests → Lab receives → Sample collected → Processing → Result recorded → Authorized review → Doctor views. Patients see only reviewed results.</p>
      {rows.length === 0 ? <Empty text="No test orders." /> : (
        <div className="space-y-2">{rows.slice(0, 100).map((o) => (
          <div key={o.id} className="card !p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><b>#{o.id}</b> · 🧪 {o.test} · <b>{o.patient}</b> <span className="text-xs text-slate-500">({o.code})</span> <PriorityBadge value={o.priority} />
                <div className="mt-1"><span className="rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-2 py-0.5 text-xs font-bold">{LBL[o.status]}</span></div></div>
              <div className="flex flex-wrap gap-1">
                {isLab && FLOW.indexOf(o.status) >= 0 && FLOW.indexOf(o.status) < 3 && <button onClick={() => advance(o)} className="rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-bold text-white">→ {LBL[FLOW[FLOW.indexOf(o.status) + 1]]}</button>}
                {isLab && o.status === 'processing' && <button onClick={() => setResFor(o)} className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white">📝 Record result</button>}
                {(isLab || user?.role === 'doctor') && o.status === 'completed' && <button onClick={() => review(o.id)} className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-bold text-white">✓ Authorized review</button>}
                {isLab && o.result && <label className="cursor-pointer rounded-lg bg-slate-600 px-2.5 py-1 text-xs font-bold text-white">📎 Upload<input type="file" className="hidden" onChange={(e) => upload(o.id, e.target.files?.[0])} /></label>}
              </div>
            </div>
            <div className="mt-2 flex gap-1">{FLOW.map((s) => <div key={s} title={LBL[s]} className={`h-1.5 flex-1 rounded-full ${FLOW.indexOf(s) <= FLOW.indexOf(o.status) ? 'bg-violet-500' : 'bg-slate-200 dark:bg-white/10'}`} />)}</div>
            {o.result && <div className="mt-2 rounded-xl bg-slate-50 dark:bg-white/5 p-2.5 text-sm"><b>Result {o.result.reviewed ? '(reviewed ✓)' : '(awaiting review)'}:</b> {o.result.text}{o.result.attachment && <span className="ml-2 text-xs">📎 {o.result.attachment}</span>}</div>}
          </div>))}</div>)}

      {show && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/50 p-4" onClick={() => setShow(false)}>
          <form onSubmit={order} onClick={(e) => e.stopPropagation()} className="card w-full max-w-md space-y-3">
            <h2 className="font-bold">🧪 Request lab test</h2>
            <input className="input" placeholder="Search patient…" value={patSearch} onChange={(e) => setPatSearch(e.target.value)} />
            <select required className="input" value={of.patient_id} onChange={(e) => setOf({ ...of, patient_id: e.target.value })}><option value="">— Select —</option>{patients.map((p) => <option key={p.id} value={p.id}>{p.patient_code} — {p.full_name}</option>)}</select>
            <select className="input" value={of.test_name} onChange={(e) => setOf({ ...of, test_name: e.target.value })}>{catalog.map((c) => <option key={c}>{c}</option>)}</select>
            <select className="input" value={of.priority} onChange={(e) => setOf({ ...of, priority: e.target.value })}><option value="routine">🟢 Routine</option><option value="urgent">🟠 Urgent</option><option value="emergency">🔴 Emergency</option></select>
            <input className="input" placeholder="Notes…" value={of.notes} onChange={(e) => setOf({ ...of, notes: e.target.value })} />
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setShow(false)} className="btn-ghost">Cancel</button><button className="btn-primary">Request</button></div>
          </form>
        </div>)}

      {resFor && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/50 p-4" onClick={() => setResFor(null)}>
          <div onClick={(e) => e.stopPropagation()} className="card w-full max-w-md space-y-3">
            <h2 className="font-bold">📝 Result — Order #{resFor.id} ({resFor.test})</h2>
            <textarea className="input" rows={4} value={resText} onChange={(e) => setResText(e.target.value)} placeholder="Enter findings / values…" />
            <div className="flex justify-end gap-2"><button onClick={() => setResFor(null)} className="btn-ghost">Cancel</button><button onClick={saveResult} className="btn-ok">Save result</button></div>
          </div>
        </div>)}
    </div>
  );
}
