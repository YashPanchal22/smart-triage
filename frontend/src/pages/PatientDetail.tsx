import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { Loading, PriorityBadge, StatusBadge } from '../components';

export default function PatientDetail() {
  const { id } = useParams();
  const [d, setD] = useState<any>(null);
  useEffect(() => { api.get(`/api/patients/${id}`).then((r) => setD(r.data)); }, [id]);
  if (!d) return <Loading />;
  const current = d.visits?.[0];
  return (
    <div className="space-y-4">
      <Link to="/patients" className="text-sm font-semibold text-brand-600">← Back to patients</Link>
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{d.full_name} <span className="font-mono text-base text-slate-500">{d.patient_code}</span></h1>
            <p className="text-sm text-slate-500">{d.age} yrs · {d.gender} · 📞 {d.phone || '—'} · ✉️ {d.email || '—'}</p>
            <p className="text-sm text-slate-500">📍 {d.address || '—'} · 🆘 {d.emergency_contact_name} {d.emergency_contact_phone}</p>
          </div>
          {current && <div className="flex gap-2"><PriorityBadge value={current.priority} /><StatusBadge value={current.status} /></div>}
        </div>
        <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3"><b>Existing conditions</b><p>{d.existing_conditions || '—'}</p></div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3"><b>Allergies</b><p>{d.allergies || '—'}</p></div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3"><b>Medications</b><p>{d.medications || '—'}</p></div>
        </div>
      </div>
      {current && (
        <div className="card">
          <h3 className="font-bold">Current visit #{current.id}</h3>
          <p className="text-sm"><b>Complaint:</b> {current.chief_complaint} · <b>Symptoms:</b> {current.symptoms} · <b>Dept:</b> {current.department} · <b>Wait:</b> {current.waiting_live_min} min</p>
          <div className="mt-2 rounded-xl bg-slate-50 dark:bg-slate-800 p-3 text-sm">
            <b>Why this priority?</b>
            <ul className="mt-1 list-disc pl-5">{current.priority_reasons?.map((r: string, i: number) => <li key={i}>{r}</li>)}</ul>
          </div>
        </div>
      )}
      <div className="card">
        <h3 className="font-bold">Visit history ({d.visits?.length || 0})</h3>
        <div className="mt-2 overflow-x-auto"><table className="grid-table">
          <thead><tr><th>ID</th><th>Date</th><th>Complaint</th><th>Priority</th><th>Status</th><th>Wait</th></tr></thead>
          <tbody>{d.visits?.map((v: any) => <tr key={v.id}><td>#{v.id}</td><td className="text-xs">{v.arrival_time?.slice(0, 16).replace('T', ' ')}</td><td>{v.chief_complaint}</td><td><PriorityBadge value={v.priority} /></td><td><StatusBadge value={v.status} /></td><td>{v.waiting_minutes ?? v.waiting_live_min} min</td></tr>)}</tbody>
        </table></div>
      </div>
      <div className="card">
        <h3 className="font-bold">Triage history ({d.triages?.length || 0})</h3>
        <div className="mt-2 space-y-2">{d.triages?.map((t: any) => (
          <div key={t.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-sm">
            <b>Visit #{t.visit_id}</b> · {t.created_at?.slice(0, 16).replace('T', ' ')} · suggested <PriorityBadge value={t.suggested_priority} /> → final <PriorityBadge value={t.final_priority} />
            <p className="mt-1 text-xs text-slate-500">Vitals: T {t.vitals.temp}°C · HR {t.vitals.hr} · BP {t.vitals.sbp}/{t.vitals.dbp} · RR {t.vitals.rr} · SpO2 {t.vitals.spo2}% · {t.vitals.consciousness} · pain {t.vitals.pain}/10</p>
          </div>))}</div>
      </div>
    </div>
  );
}
