import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useLive } from '../live';
import { useAuth } from '../auth';
import { Empty, Loading, PriorityBadge, StatusBadge } from '../components';

export default function Queue() {
  const [rows, setRows] = useState<any[]>([]);
  const [depts, setDepts] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [q, setQ] = useState(''); const [pri, setPri] = useState(''); const [st, setSt] = useState(''); const [dep, setDep] = useState('');
  const [busy, setBusy] = useState<number | null>(null);
  const [noteFor, setNoteFor] = useState<any | null>(null);
  const [labFor, setLabFor] = useState<any | null>(null);
  const [referFor, setReferFor] = useState<any | null>(null);
  const { lastEvent } = useLive();
  const { user } = useAuth();
  const staff = user?.role !== 'patient';
  const clinical = ['admin', 'superadmin', 'doctor', 'nurse', 'triage'].includes(user?.role || '');

  const load = async () => {
    try {
      const params: any = {};
      if (pri) params.priority = pri; if (st) params.status = st; if (dep) params.department_id = dep; if (q) params.search = q;
      const { data } = await api.get('/api/queue', { params });
      setRows(data);
    } catch {}
  };
  useEffect(() => { api.get('/api/departments').then((r) => setDepts(r.data)); api.get('/api/doctors').then((r) => setDocs(r.data)); }, []);
  useEffect(() => { load(); }, []);
  useEffect(() => { const t = setTimeout(load, 350); return () => clearTimeout(t); }, [q, pri, st, dep]);
  useEffect(() => { if (lastEvent && ['queue_updated', 'triage_completed', 'emergency'].includes(lastEvent.event)) load(); }, [lastEvent]);

  // live waiting-time ticker
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);
  const waitOf = (r: any) => { const base = r.waiting_live_min || 0; const extra = Math.floor((now - (r._t || (r._t = Date.now()))) / 60000); return base + extra; };

  const act = async (id: number, status: string, extra: any = {}) => {
    setBusy(id);
    try { await api.patch(`/api/queue/${id}`, { status, ...extra }); await load(); } catch (e: any) { alert(e?.response?.data?.detail || 'Failed'); }
    finally { setBusy(null); }
  };
  const emergency = async (id: number) => {
    if (!confirm('Flag this case as EMERGENCY and move it to the emergency queue?')) return;
    setBusy(id);
    try { await api.post(`/api/queue/${id}/emergency`); await load(); } catch (e: any) { alert(e?.response?.data?.detail || 'Failed'); }
    finally { setBusy(null); }
  };

  const counts = useMemo(() => {
    const c: any = { emergency: 0, urgent: 0, semi_urgent: 0, routine: 0 };
    rows.forEach((r) => { c[r.priority] = (c[r.priority] || 0) + 1; });
    return c;
  }, [rows]);

  if (!rows) return <Loading />;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Live Doctor Queue <span className="text-sm font-normal text-slate-500">· auto-sorted by priority · updates in real time</span></h1>
        <div className="flex gap-2 text-xs">🔴 {counts.emergency} · 🟠 {counts.urgent} · 🟡 {counts.semi_urgent} · 🟢 {counts.routine}</div>
      </div>
      <div className="card flex flex-wrap gap-2">
        <input className="input max-w-xs" placeholder="🔍 Search patient / ID…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input max-w-[160px]" value={pri} onChange={(e) => setPri(e.target.value)}><option value="">All priorities</option><option value="emergency">🔴 Emergency</option><option value="urgent">🟠 Urgent</option><option value="semi_urgent">🟡 Semi-Urgent</option><option value="routine">🟢 Routine</option></select>
        <select className="input max-w-[160px]" value={st} onChange={(e) => setSt(e.target.value)}><option value="">All statuses</option><option value="waiting">Waiting</option><option value="called">Called</option><option value="under_assessment">Under assessment</option></select>
        <select className="input max-w-[200px]" value={dep} onChange={(e) => setDep(e.target.value)}><option value="">All departments</option>{depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
      </div>
      {rows.length === 0 ? <Empty text="Queue is empty for these filters. 🎉" /> : (
        <div className="card !p-0 overflow-x-auto"><table className="grid-table">
          <thead><tr><th>Priority</th><th>Patient</th><th>Waiting</th><th>Department</th><th>Status</th><th>Doctor</th>{staff && <th>Actions</th>}</tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={`pri-${r.priority} ${r.priority === 'emergency' ? 'bg-red-50/70 dark:bg-red-950/20' : ''}`}>
                <td><PriorityBadge value={r.priority} /><div className="text-[11px] text-slate-500">score {r.priority_score}</div></td>
                <td><Link to={`/patients/${r.patient_id}`} className="font-semibold text-brand-600">{r.patient_name}</Link><div className="text-xs text-slate-500">{r.patient_code} · {r.chief_complaint?.slice(0, 40)}</div></td>
                <td className="font-bold">{waitOf(r)} min</td>
                <td>{r.department}</td>
                <td><StatusBadge value={r.status} /></td>
                <td>
                  {staff ? (
                    <select className="input !w-40 !py-1 text-xs" value={r.assigned_doctor_id || ''} onChange={(e) => act(r.id, r.status, { assigned_doctor_id: Number(e.target.value) })}>
                      <option value="">Unassigned</option>
                      {docs.filter((d) => !r.department_id || d.department_id === r.department_id).map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                    </select>
                  ) : '—'}
                </td>
                {staff && (
                  <td><div className="flex flex-wrap gap-1">
                    <button disabled={busy === r.id} onClick={() => act(r.id, 'called')} className="rounded-lg bg-violet-600 px-2 py-1 text-xs font-semibold text-white">Called</button>
                    <button disabled={busy === r.id} onClick={() => act(r.id, 'under_assessment')} className="rounded-lg bg-amber-600 px-2 py-1 text-xs font-semibold text-white">Assessing</button>
                    <button disabled={busy === r.id} onClick={() => act(r.id, 'completed')} className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-semibold text-white">Done</button>
                    <button disabled={busy === r.id} onClick={() => emergency(r.id)} className="rounded-lg bg-red-600 px-2 py-1 text-xs font-semibold text-white">🚨</button>
                    {clinical && <button onClick={() => setNoteFor(r)} className="rounded-lg bg-sky-600 px-2 py-1 text-xs font-semibold text-white">📝 Note</button>}
                    {clinical && <button onClick={() => setLabFor(r)} className="rounded-lg bg-purple-600 px-2 py-1 text-xs font-semibold text-white">🧪 Lab</button>}
                    {clinical && <button onClick={() => setReferFor(r)} className="rounded-lg bg-slate-600 px-2 py-1 text-xs font-semibold text-white">↗ Refer</button>}
                  </div></td>
                )}
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      {noteFor && <NoteModal row={noteFor} onClose={() => { setNoteFor(null); load(); }} />}
      {labFor && <LabModal row={labFor} onClose={() => { setLabFor(null); load(); }} />}
      {referFor && <ReferModal row={referFor} depts={depts} onClose={() => { setReferFor(null); load(); }} />}
    </div>
  );
}

function NoteModal({ row, onClose }: { row: any; onClose: () => void }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!text.trim()) { alert('Write the clinical note first.'); return; }
    setBusy(true);
    try { await api.post('/api/eco2/consultations', { patient_id: row.patient_id, queue_id: row.id, note: text }); onClose(); }
    catch (e: any) { alert(e?.response?.data?.detail || 'Failed to save note'); }
    finally { setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="card w-full max-w-lg space-y-3" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold">📝 Clinical note — {row.patient_name} <span className="text-xs font-normal text-slate-500">({row.patient_code})</span></h3>
        <textarea className="input min-h-[120px]" value={text} onChange={(e) => setText(e.target.value)} placeholder="Assessment, plan, advice…" />
        <div className="flex justify-end gap-2"><button onClick={onClose} className="btn-outline">Cancel</button><button disabled={busy} onClick={save} className="btn-primary">{busy ? 'Saving…' : 'Save note'}</button></div>
      </div>
    </div>
  );
}

function LabModal({ row, onClose }: { row: any; onClose: () => void }) {
  const [test, setTest] = useState('CBC');
  const [urgency, setUrgency] = useState('routine');
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try { await api.post('/api/eco2/lab-orders', { patient_id: row.patient_id, queue_id: row.id, test_name: test, urgency }); onClose(); }
    catch (e: any) { alert(e?.response?.data?.detail || 'Failed to order test'); }
    finally { setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="card w-full max-w-md space-y-3" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold">🧪 Order lab test — {row.patient_name}</h3>
        <div><label className="label">Test</label><select className="input" value={test} onChange={(e) => setTest(e.target.value)}>{['CBC', 'Blood Sugar (FBS/RBS)', 'Lipid Profile', 'Thyroid (TSH)', 'Liver Function (LFT)', 'Kidney Function (KFT)', 'Urine Routine', 'X-Ray', 'ECG', 'HbA1c', 'Vitamin D', 'CRP'].map((t) => <option key={t}>{t}</option>)}</select></div>
        <div><label className="label">Urgency</label><select className="input" value={urgency} onChange={(e) => setUrgency(e.target.value)}><option value="routine">Routine</option><option value="urgent">Urgent</option><option value="stat">STAT</option></select></div>
        <div className="flex justify-end gap-2"><button onClick={onClose} className="btn-outline">Cancel</button><button disabled={busy} onClick={save} className="btn-primary">{busy ? 'Ordering…' : 'Place order'}</button></div>
      </div>
    </div>
  );
}

function ReferModal({ row, depts, onClose }: { row: any; depts: any[]; onClose: () => void }) {
  const [dept, setDept] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!dept) { alert('Choose the department to refer to.'); return; }
    setBusy(true);
    try { await api.post('/api/eco2/refer', { patient_id: row.patient_id, queue_id: row.id, to_department_id: Number(dept), reason }); onClose(); }
    catch (e: any) { alert(e?.response?.data?.detail || 'Failed to refer'); }
    finally { setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="card w-full max-w-md space-y-3" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold">↗ Refer — {row.patient_name} <span className="text-xs font-normal text-slate-500">(from {row.department})</span></h3>
        <div><label className="label">To department</label><select className="input" value={dept} onChange={(e) => setDept(e.target.value)}><option value="">Select…</option>{depts.filter((d: any) => d.id !== row.department_id).map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
        <div><label className="label">Reason</label><textarea className="input min-h-[80px]" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this patient being referred?" /></div>
        <div className="flex justify-end gap-2"><button onClick={onClose} className="btn-outline">Cancel</button><button disabled={busy} onClick={save} className="btn-primary">{busy ? 'Referring…' : 'Refer patient'}</button></div>
      </div>
    </div>
  );
}
