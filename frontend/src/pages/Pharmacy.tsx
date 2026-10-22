import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { useLive } from '../live';
import { Empty } from '../components';

export default function Pharmacy() {
  const { user } = useAuth();
  const { lastEvent } = useLive();
  const [tab, setTab] = useState('inventory');
  const [items, setItems] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [expDays, setExpDays] = useState(0);
  const [oStatus, setOStatus] = useState('');
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ name: '', batch_no: '', quantity: 50, unit: 'strips', expiry: '', reorder_level: 20 });
  const canManage = ['pharmacy', 'admin', 'superadmin'].includes(user?.role || '');

  const load = async () => {
    try {
      const [a, b] = await Promise.all([
        api.get('/api/pharmacy/items', { params: { search: q, low_only: lowOnly, expiring_days: expDays } }),
        api.get('/api/pharmacy/orders', { params: oStatus ? { status: oStatus } : {} }),
      ]);
      setItems(a.data); setOrders(b.data);
    } catch {}
  };
  useEffect(() => { load(); }, [oStatus]);
  useEffect(() => { const t = setTimeout(load, 350); return () => clearTimeout(t); }, [q, lowOnly, expDays]);
  useEffect(() => { if (lastEvent?.event === 'pharmacy_updated') load(); }, [lastEvent]);

  const save = async (e: any) => {
    e.preventDefault();
    try { await api.post('/api/pharmacy/items', { ...f, quantity: Number(f.quantity), reorder_level: Number(f.reorder_level), expiry: f.expiry || null }); setShow(false); load(); } catch (err: any) { alert(err?.response?.data?.detail || 'Failed'); }
  };
  const adjust = async (it: any, delta: number) => {
    try { await api.patch(`/api/pharmacy/items/${it.id}`, { quantity: Math.max(0, it.qty + delta) }); load(); } catch {}
  };
  const setOrder = async (id: number, status: string) => {
    try { await api.patch(`/api/pharmacy/orders/${id}`, { status }); load(); } catch (err: any) { alert(err?.response?.data?.detail || 'Failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-black tracking-tight">💊 Pharmacy</h1>
        <div className="flex gap-2">
          {['inventory', 'orders'].map((t) => <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 text-sm font-bold ${tab === t ? 'bg-brand-600 text-white' : 'border border-slate-300 dark:border-slate-700'}`}>{t === 'inventory' ? '📦 Inventory' : `📋 Order Queue (${orders.filter((o) => o.status === 'pending').length})`}</button>)}
          {canManage && tab === 'inventory' && <button onClick={() => setShow(true)} className="btn-primary">＋ Item</button>}
        </div>
      </div>
      <p className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-2.5 text-xs text-amber-800 dark:text-amber-200">Orders are entered by authorized staff from human prescriptions — the system never prescribes medication.</p>

      {tab === 'inventory' ? (<>
        <div className="card flex flex-wrap gap-2">
          <input className="input max-w-xs" placeholder="🔍 Search medicine…" value={q} onChange={(e) => setQ(e.target.value)} />
          <label className="flex items-center gap-1 self-center text-sm"><input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} className="accent-red-600" /> ⚠️ Low stock only</label>
          <select className="input max-w-[180px]" value={expDays} onChange={(e) => setExpDays(Number(e.target.value))}><option value={0}>Any expiry</option><option value={30}>⏰ Expiring ≤30d</option><option value={90}>⏰ Expiring ≤90d</option></select>
        </div>
        {items.length === 0 ? <Empty text="No items found." /> : (
          <div className="card !p-0 overflow-x-auto"><table className="grid-table">
            <thead><tr><th>Medicine</th><th>Batch</th><th>Qty</th><th>Unit</th><th>Expiry</th><th>Status</th>{canManage && <th>Adjust</th>}</tr></thead>
            <tbody>{items.map((it) => (
              <tr key={it.id} className={it.low ? 'bg-amber-50/60 dark:bg-amber-950/20' : ''}>
                <td className="font-semibold">{it.name}</td><td className="font-mono text-xs">{it.batch}</td>
                <td className="font-bold">{it.qty}</td><td>{it.unit}</td><td>{it.expiry || '—'}</td>
                <td>{it.low ? <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-bold">⚠️ LOW</span> : <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-bold">OK</span>}</td>
                {canManage && <td><div className="flex gap-1"><button onClick={() => adjust(it, 10)} className="rounded bg-emerald-600 px-2 py-1 text-xs text-white">+10</button><button onClick={() => adjust(it, -1)} className="rounded bg-stone-500 px-2 py-1 text-xs text-white">−1</button></div></td>}
              </tr>))}</tbody>
          </table></div>)}
      </>) : (<>
        <div className="card flex gap-2">
          <select className="input max-w-[200px]" value={oStatus} onChange={(e) => setOStatus(e.target.value)}><option value="">All statuses</option>{['pending', 'dispensing', 'dispensed', 'cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}</select>
        </div>
        {orders.length === 0 ? <Empty text="No orders." /> : (
          <div className="space-y-2">{orders.slice(0, 80).map((o) => (
            <div key={o.id} className="card !p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><b>Order #{o.id}</b> · {o.patient} <span className="text-xs text-slate-500">({o.code})</span><div className="text-sm text-slate-500">{o.items.map((i: any) => `${i.name} ×${i.qty}`).join(' · ')}</div></div>
                <div className="flex items-center gap-2"><b className="text-sm">{o.status}</b>
                  {canManage && o.status === 'pending' && <button onClick={() => setOrder(o.id, 'dispensing')} className="rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-bold text-white">Start dispensing</button>}
                  {canManage && o.status === 'dispensing' && <button onClick={() => setOrder(o.id, 'dispensed')} className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white">✓ Dispense (−stock)</button>}
                </div>
              </div>
            </div>))}</div>)}
      </>)}

      {show && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/50 p-4" onClick={() => setShow(false)}>
          <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="card w-full max-w-md space-y-3">
            <h2 className="font-bold">Add stock item</h2>
            <input required className="input" placeholder="Medicine name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <input className="input" placeholder="Batch no." value={f.batch_no} onChange={(e) => setF({ ...f, batch_no: e.target.value })} />
              <input type="number" className="input" placeholder="Qty" value={f.quantity} onChange={(e) => setF({ ...f, quantity: Number(e.target.value) })} />
              <input className="input" placeholder="Unit" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} />
              <input type="number" className="input" placeholder="Reorder lvl" value={f.reorder_level} onChange={(e) => setF({ ...f, reorder_level: Number(e.target.value) })} />
            </div>
            <input type="date" className="input" value={f.expiry} onChange={(e) => setF({ ...f, expiry: e.target.value })} />
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setShow(false)} className="btn-ghost">Cancel</button><button className="btn-primary">Save</button></div>
          </form>
        </div>)}
    </div>
  );
}
