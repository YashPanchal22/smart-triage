import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Reports() {
  const [summary, setSummary] = useState<any>(null);
  const [audit, setAudit] = useState<any[]>([]);
  useEffect(() => {
    api.get('/api/reports/summary').then((r) => setSummary(r.data)).catch(() => {});
    api.get('/api/audit?limit=60').then((r) => setAudit(r.data)).catch(() => {});
  }, []);
  const dl = async (endpoint: string, name: string, fmt: string) => {
    try {
      const { data } = await api.get(`${endpoint}?format=${fmt}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url; a.download = `${name}.${fmt === 'excel' ? 'xlsx' : fmt}`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch { alert('Download failed — insufficient role permission.'); }
  };
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reports & Audit</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {[
          ['Daily patient report', '/api/reports/daily', 'daily_report', 'Priority mix, departments, waiting analysis.'],
          ['Appointment report', '/api/reports/appointments', 'appointment_report', 'Bookings, doctors, slots, statuses.'],
          ['Blood-bank report', '/api/reports/blood', 'blood_bank_report', 'Inventory by group + request log.'],
          ['Emergency report', '/api/reports/emergency', 'emergency_report', 'Incidents, types, ambulances, statuses.'],
        ].map(([title, ep, name, desc]) => (
          <div key={name as string} className="card">
            <h3 className="font-bold">{title}</h3>
            <p className="text-sm text-slate-500">{desc} Synthetic demo data.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button onClick={() => dl(ep as string, name as string, 'csv')} className="btn-ghost">⬇️ CSV</button>
              <button onClick={() => dl(ep as string, name as string, 'excel')} className="btn-ghost">⬇️ Excel</button>
              <button onClick={() => dl(ep as string, name as string, 'pdf')} className="btn-ghost">⬇️ PDF</button>
            </div>
          </div>))}
      </div>
      {summary && (
        <div className="card">
          <h3 className="font-bold">30-day summary</h3>
          <div className="mt-2 grid gap-3 text-sm md:grid-cols-3">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3"><b>Total visits:</b> {summary.total_visits}<br /><b>Mean wait:</b> {summary.waiting.mean} min · <b>Median:</b> {summary.waiting.median} · <b>Max:</b> {summary.waiting.max}</div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3"><b>Priority mix</b>{Object.entries(summary.priority_distribution).map(([k, v]: any) => <div key={k}>· {k}: {v}</div>)}</div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3"><b>Resources</b>{summary.resources.map((r: any) => <div key={r.ward}>· {r.ward}: {r.occupied}/{r.total}</div>)}</div>
          </div>
        </div>)}
      <div className="card">
        <h3 className="font-bold">Audit trail (recent)</h3>
        <div className="mt-2 max-h-96 overflow-y-auto"><table className="grid-table">
          <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead>
          <tbody>{audit.map((a) => <tr key={a.id}><td className="text-xs">{a.at?.slice(0, 19).replace('T', ' ')}</td><td>#{a.user_id}</td><td className="font-semibold">{a.action}</td><td>{a.entity} {a.entity_id}</td><td className="max-w-[320px] truncate text-xs">{a.details}</td></tr>)}</tbody>
        </table></div>
      </div>
    </div>
  );
}
