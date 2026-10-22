import { useEffect, useState } from 'react';
import { api } from '../api';
import { Empty, PriorityBadge, DISCLAIMER } from '../components';
import { useAuth } from '../auth';

const WARNINGS = [
  ['chest_pain', 'Chest pain / pressure'], ['breathing_difficulty', 'Severe breathing difficulty'],
  ['unresponsive', 'Unresponsive / fainted'], ['severe_bleeding', 'Severe bleeding'],
  ['stroke_signs', 'Stroke signs'], ['severe_trauma', 'Severe trauma'],
  ['seizure', 'Ongoing seizure'], ['allergic_reaction', 'Severe allergic reaction'],
];
const RISKS = ['diabetes', 'hypertension', 'heart disease', 'asthma', 'kidney disease', 'pregnancy', 'elderly-frail', 'immunocompromised'];

export default function Triage() {
  const { user } = useAuth();
  const [queue, setQueue] = useState<any[]>([]);
  const [visitId, setVisitId] = useState('');
  const [f, setF] = useState<any>({ chief_complaint: '', symptoms: '', temperature: '', heart_rate: '', sbp: '', dbp: '', respiratory_rate: '', spo2: '', consciousness: 'alert', pain_score: 0, notes: '' });
  const [warns, setWarns] = useState<string[]>([]);
  const [risks, setRisks] = useState<string[]>([]);
  const [override, setOverride] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const staff = user?.role !== 'patient';

  useEffect(() => { api.get('/api/queue').then((r) => setQueue(r.data)); }, []);
  const sel = queue.find((q) => String(q.id) === String(visitId));
  const set = (k: string, v: any) => setF({ ...f, [k]: v });
  const toggle = (arr: string[], v: string, fn: any) => fn(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const num = (v: any) => (v === '' || v === null ? null : Number(v));

  const submit = async (e: any) => {
    e.preventDefault();
    if (!visitId) { alert('Select a visit from the queue first.'); return; }
    setBusy(true); setResult(null);
    try {
      const { data } = await api.post('/api/triage', {
        visit_id: Number(visitId), ...f,
        temperature: num(f.temperature), heart_rate: num(f.heart_rate), sbp: num(f.sbp), dbp: num(f.dbp),
        respiratory_rate: num(f.respiratory_rate), spo2: num(f.spo2), pain_score: Number(f.pain_score),
        warning_indicators: warns, risk_factors: risks,
        override_priority: override || null, override_reason: overrideReason,
      });
      setResult(data);
    } catch (err: any) { alert(err?.response?.data?.detail || 'Triage failed'); }
    finally { setBusy(false); }
  };

  if (!staff) return <div className="card">Triage assessment is available to <b>doctors, triage staff and admins</b>. Patients can register and view their visit status in the queue.</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Triage Assessment</h1>
      <p className="rounded-xl bg-slate-100 dark:bg-slate-800 p-3 text-xs text-slate-600 dark:text-slate-300">Flow: Patient → Triage Assessment → Priority Engine → Priority Category → Reason/Factors → Doctor Queue. {DISCLAIMER}</p>
      <div className="grid gap-4 lg:grid-cols-3">
        <form onSubmit={submit} className="card space-y-3 lg:col-span-2">
          <div><label className="label">Select visit from live queue *</label>
            <select className="input" value={visitId} onChange={(e) => { setVisitId(e.target.value); const v = queue.find((x) => String(x.id) === e.target.value); if (v) { setF({ ...f, chief_complaint: v.chief_complaint || '', symptoms: v.symptoms || '' }); } }}>
              <option value="">— Select patient visit —</option>
              {queue.map((v) => <option key={v.id} value={v.id}>#{v.id} · {v.patient_name} ({v.patient_code}) · {v.department} · {v.priority}</option>)}
            </select></div>
          {sel && <p className="text-sm">Assessing <b>{sel.patient_name}</b>, {sel.patient_age} yrs · {sel.department} · current: <PriorityBadge value={sel.priority} /></p>}
          <div className="grid gap-3 md:grid-cols-2">
            <div><label className="label">Chief complaint</label><input className="input" value={f.chief_complaint} onChange={(e) => set('chief_complaint', e.target.value)} /></div>
            <div><label className="label">Symptoms</label><input className="input" value={f.symptoms} onChange={(e) => set('symptoms', e.target.value)} /></div>
            <div><label className="label">Temperature (°C)</label><input type="number" step="0.1" className="input" value={f.temperature} onChange={(e) => set('temperature', e.target.value)} placeholder="37.0" /></div>
            <div><label className="label">Heart rate (bpm)</label><input type="number" className="input" value={f.heart_rate} onChange={(e) => set('heart_rate', e.target.value)} placeholder="80" /></div>
            <div><label className="label">BP systolic</label><input type="number" className="input" value={f.sbp} onChange={(e) => set('sbp', e.target.value)} placeholder="120" /></div>
            <div><label className="label">BP diastolic</label><input type="number" className="input" value={f.dbp} onChange={(e) => set('dbp', e.target.value)} placeholder="80" /></div>
            <div><label className="label">Respiratory rate (/min)</label><input type="number" className="input" value={f.respiratory_rate} onChange={(e) => set('respiratory_rate', e.target.value)} placeholder="18" /></div>
            <div><label className="label">SpO2 (%)</label><input type="number" step="0.1" className="input" value={f.spo2} onChange={(e) => set('spo2', e.target.value)} placeholder="98" /></div>
            <div><label className="label">Consciousness / alertness</label><select className="input" value={f.consciousness} onChange={(e) => set('consciousness', e.target.value)}><option value="alert">Alert</option><option value="voice">Responds to voice</option><option value="pain">Responds to pain only</option><option value="unresponsive">Unresponsive</option></select></div>
            <div><label className="label">Pain severity (0–10): {f.pain_score}</label><input type="range" min={0} max={10} className="w-full" value={f.pain_score} onChange={(e) => set('pain_score', e.target.value)} /></div>
          </div>
          <div><label className="label">Emergency warning indicators</label>
            <div className="flex flex-wrap gap-2">{WARNINGS.map(([k, label]) => <label key={k} className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold ${warns.includes(k) ? 'border-red-500 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'border-slate-300 dark:border-slate-700'}`}><input type="checkbox" className="mr-1" checked={warns.includes(k)} onChange={() => toggle(warns, k, setWarns)} />{label}</label>)}</div></div>
          <div><label className="label">Risk factors (authorised staff only)</label>
            <div className="flex flex-wrap gap-2">{RISKS.map((r) => <label key={r} className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold ${risks.includes(r) ? 'border-brand-500 bg-brand-100 text-brand-700 dark:bg-brand-900/40' : 'border-slate-300 dark:border-slate-700'}`}><input type="checkbox" className="mr-1" checked={risks.includes(r)} onChange={() => toggle(risks, r, setRisks)} />{r}</label>)}</div></div>
          <div><label className="label">Triage notes</label><textarea className="input" rows={2} value={f.notes} onChange={(e) => set('notes', e.target.value)} /></div>
          <div className="grid gap-3 rounded-xl bg-slate-50 dark:bg-slate-800 p-3 md:grid-cols-2">
            <div><label className="label">Override priority (optional, audited)</label><select className="input" value={override} onChange={(e) => setOverride(e.target.value)}><option value="">— Use engine suggestion —</option><option value="emergency">🔴 Emergency</option><option value="urgent">🟠 Urgent</option><option value="semi_urgent">🟡 Semi-Urgent</option><option value="routine">🟢 Routine</option></select></div>
            <div><label className="label">Override reason</label><input className="input" value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="Clinical justification…" /></div>
          </div>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Evaluating…' : 'Submit triage → run priority engine'}</button>
        </form>
        <div className="space-y-3">
          <div className="card">
            <h3 className="font-bold">Priority result</h3>
            {!result ? <div className="mt-2"><Empty text="Submit the form to see the transparent priority recommendation here." /></div> : (
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">Suggested: <PriorityBadge value={result.suggested_priority} /> <span className="text-sm">score {result.score}</span></div>
                <div className="flex items-center gap-2">Final: <PriorityBadge value={result.final_priority} /></div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 text-sm">
                  <b>Why this priority?</b>
                  <ul className="mt-1 list-disc pl-5">{result.reasons.map((r: string, i: number) => <li key={i}>{r}</li>)}</ul>
                </div>
                <p className="text-[11px] text-slate-500">{result.disclaimer}</p>
                <p className="text-sm text-emerald-600 font-semibold">✓ Patient placed in doctor queue automatically.</p>
              </div>
            )}
          </div>
          <div className="card text-xs text-slate-500">
            <b>How scoring works (transparent):</b>
            <ul className="mt-1 list-disc pl-4 space-y-0.5">
              <li>Emergency indicator: +30 (multiple: +35)</li>
              <li>Critical vitals (SpO2/HR/RR/BP): +30 · abnormal: +20</li>
              <li>Unresponsive +30 · pain-only +20 · voice-only +10</li>
              <li>Pain 9–10: +15 · 7–8: +10 · 4–6: +5</li>
              <li>Age ≤2 or ≥75: +10 · risk factors up to +10</li>
              <li>≥30 Emergency · ≥20 Urgent · ≥10 Semi-Urgent · else Routine</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
