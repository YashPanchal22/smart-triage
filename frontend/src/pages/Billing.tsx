import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { Empty } from '../components';

export default function Billing() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [patSearch, setPatSearch] = useState('');
  const [patients, setPatients] = useState<any[]>([]);
  const [pid, setPid] = useState('');
  const [items, setItems] = useState([{ label: 'Consultation', amount: 300 }]);
  const staff = ['admin', 'triage'].includes(user?.role || '');

  const load = async () => { try { const { data } = await api.get('/api/billing/invoices'); setRows(data); } catch {} };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(async () => { try { const { data } = await api.get('/api/patients', { params: { search: patSearch, limit: 10 } }); setPatients(data.items); } catch {} }, 300);
    return () => clearTimeout(t);
  }, [patSearch, show]);

  const create = async (e: any) => {
    e.preventDefault();
    try { await api.post('/api/billing/invoices', { patient_id: Number(pid), items }); setShow(false); load(); } catch (err: any) { alert(err?.response?.data?.detail || 'Failed'); }
  };
  const setStatus = async (id: number, status: string) => { await api.patch(`/api/billing/invoices/${id}`, { status }); load(); };
  const total = items.reduce((s, i) => s + Number(i.amount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🧾 Billing <span className="text-sm font-normal text-slate-500">(demo invoices in ₹)</span></h1>
        {staff && <button onClick={() => setShow(true)} className="btn-primary">＋ New invoice</button>}
      </div>
      {rows.length === 0 ? <Empty text="No invoices." /> : (
        <div className="card !p-0 overflow-x-auto"><table className="grid-table">
          <thead><tr><th>ID</th><th>Patient</th><th>Items</th><th>Total</th><th>Status</th>{staff && <th>Actions</th>}</tr></thead>
          <tbody>{rows.slice(0, 100).map((r) => (
            <tr key={r.id}><td className="font-mono">#{r.id}</td><td className="font-medium">{r.patient_name}</td>
              <td className="text-xs">{r.items.map((i: any) => `${i.label} ₹${i.amount}`).join(' · ')}</td>
              <td className="font-bold">₹{r.total}</td>
              <td><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${r.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : r.status === 'waived' ? 'bg-slate-200 text-slate-600' : 'bg-amber-100 text-amber-700'}`}>{r.status}</span></td>
              {staff && <td><div className="flex gap-1"><button onClick={() => setStatus(r.id, 'paid')} className="rounded bg-emerald-600 px-2 py-1 text-xs text-white">Paid</button><button onClick={() => setStatus(r.id, 'waived')} className="rounded bg-stone-500 px-2 py-1 text-xs text-white">Waive</button></div></td>}
            </tr>))}</tbody>
        </table></div>)}
      {show && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/50 p-4" onClick={() => setShow(false)}>
          <form onSubmit={create} onClick={(e) => e.stopPropagation()} className="card w-full max-w-md space-y-3">
            <h2 className="font-bold">New invoice</h2>
            <input className="input" placeholder="Search patient…" value={patSearch} onChange={(e) => setPatSearch(e.target.value)} />
            <select required className="input" value={pid} onChange={(e) => setPid(e.target.value)}><option value="">— Select —</option>{patients.map((p) => <option key={p.id} value={p.id}>{p.patient_code} — {p.full_name}</option>)}</select>
            {items.map((it, i) => (
              <div key={i} className="flex gap-2">
                <input className="input" value={it.label} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
                <input type="number" className="input max-w-[110px]" value={it.amount} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, amount: Number(e.target.value) } : x))} />
                <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} className="btn-ghost">✕</button>
              </div>))}
            <button type="button" onClick={() => setItems([...items, { label: '', amount: 0 }])} className="btn-ghost w-full">＋ Add item</button>
            <p className="font-bold">Total: ₹{total}</p>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setShow(false)} className="btn-ghost">Cancel</button><button className="btn-primary">Create</button></div>
          </form>
        </div>)}
    </div>
  );
}
