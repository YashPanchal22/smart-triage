import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useLive } from '../../live';
import { Ecg, Kpi, Loading, PriorityBadge } from '../../components';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// ================= EMERGENCY =================
export function EmergencyDash() {
  const { lastEvent } = useLive();
  const [rows, setRows] = useState<any[]>([]);
  const [ambs, setAmbs] = useState<any[]>([]);
  const [eco, setEco] = useState<any>(null);
  const load = async () => {
    try {
      const [a, b, c] = await Promise.all([api.get('/api/emergency/requests'), api.get('/api/emergency/ambulances'), api.get('/api/analytics/ecosystem')]);
      setRows(a.data); setAmbs(b.data); setEco(c.data);
    } catch {}
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (lastEvent?.event === 'emergency_request') load(); }, [lastEvent]);
  const active = rows.filter((r) => !['completed', 'cancelled'].includes(r.status));
  const critical = rows.filter((r) => r.priority === 'emergency' && !['completed', 'cancelled'].includes(r.status));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><h1 className="text-2xl font-black tracking-tight">🚑 Emergency Command</h1><Ecg className="h-4 w-40 text-red-500" /><p className="text-sm text-slate-500">Real-time incident coordination · demo board (call 108/112 for real dispatch)</p></div>
        <Link to="/emergency" className="btn-danger">＋ New request</Link>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi title="Active emergencies" value={active.length} icon="🚑" />
        <Kpi title="Ambulances free" value={ambs.filter((a) => a.status === 'available').length} icon="🚐" sub={`of ${ambs.length}`} />
        <Kpi title="Emergency beds" value={eco ? eco.beds_total - eco.beds_occupied : '—'} icon="🛏️" />
        <Kpi title="Critical cases" value={critical.length} icon="🔴" />
        <Kpi title="Avg response" value="11 min" icon="⌛" sub="synthetic demo" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">{active.slice(0, 6).map((r) => (
        <div key={r.id} className="card card-hover !border-l-4 !border-l-red-500">
          <div className="flex items-center justify-between"><b>🔴 EMERGENCY #{r.id}</b><PriorityBadge value={r.priority} /></div>
          <p className="mt-1 text-sm">Status: <b>{String(r.status).replace(/_/g, ' ')}</b> · 📍 {r.location}</p>
          <p className="text-sm text-slate-500">{r.emergency_type} · {r.patient_name} {r.ambulance && `· 🚑 ${r.ambulance}`}</p>
        </div>))}
        {active.length === 0 && <div className="card">No active emergencies. 🎉</div>}</div>
    </div>
  );
}

// ================= BLOOD =================
export function BloodDash() {
  const { lastEvent } = useLive();
  const [inv, setInv] = useState<any[]>([]);
  const [reqs, setReqs] = useState<any[]>([]);
  const load = async () => {
    try { const [a, b] = await Promise.all([api.get('/api/blood/inventory'), api.get('/api/blood/requests')]); setInv(a.data); setReqs(b.data); } catch {}
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (lastEvent?.event === 'blood_updated') load(); }, [lastEvent]);
  const low = inv.filter((x) => x.available < 5);
  const open = reqs.filter((r) => r.status === 'requested');
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><h1 className="text-2xl font-black tracking-tight">🩸 Blood Bank</h1><Ecg className="h-4 w-40 text-rose-500" /><p className="text-sm text-slate-500">Inventory-focused operations · synthetic demo</p></div>
        <Link to="/blood" className="btn-primary">Open blood bank</Link>
      </div>
      {low.length > 0 && <div className="rounded-2xl border border-red-300 bg-red-50 dark:bg-red-950/30 p-3 text-sm font-bold text-red-700 dark:text-red-200">⚠️ Low stock: {low.map((x) => `${x.group} (${x.available})`).join(' · ')}</div>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi title="Total units" value={inv.reduce((s, x) => s + x.available, 0)} icon="🩸" />
        <Kpi title="Open requests" value={open.length} icon="📋" />
        <Kpi title="Emergency req" value={open.filter((r) => r.priority === 'emergency').length} icon="🔴" />
        <Kpi title="Low groups" value={low.length} icon="⚠️" />
      </div>
      <div className="grid grid-cols-4 gap-2 md:grid-cols-8">{inv.map((x) => (
        <div key={x.group} className={`card !p-2 text-center ${x.available < 5 ? '!border-red-400 !border-2' : ''}`}><p className="font-black text-red-600">{x.group}</p><p className="text-lg font-bold">{x.available}</p></div>))}</div>
      <div className="card"><h3 className="h-section">Latest requests</h3>
        <div className="mt-2 space-y-1.5">{reqs.slice(0, 8).map((r) => <div key={r.id} className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-white/5 p-2 text-sm"><span><b>#{r.id}</b> · <b className="text-red-600">{r.blood_group}</b> × {r.units} · {r.hospital_unit}</span><b>{r.status}</b></div>)} </div></div>
    </div>
  );
}

// ================= PHARMACY =================
export function PharmacyDash() {
  const { lastEvent } = useLive();
  const [d, setD] = useState<any>(null);
  const load = async () => { try { const { data } = await api.get('/api/pharmacy/overview'); setD(data); } catch {} };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (lastEvent?.event === 'pharmacy_updated') load(); }, [lastEvent]);
  if (!d) return <Loading text="Loading pharmacy…" />;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><h1 className="text-2xl font-black tracking-tight">💊 Pharmacy</h1><Ecg className="h-4 w-40 text-brand-600" /><p className="text-sm text-slate-500">Stock-focused dispensary · system never prescribes</p></div>
        <Link to="/pharmacy" className="btn-primary">Open pharmacy</Link>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi title="Medicine lines" value={d.total_items} icon="💊" sub={`${d.total_units} units`} />
        <Kpi title="Low stock" value={d.low_stock} icon="⚠️" />
        <Kpi title="Expiring soon" value={d.expiring_soon} icon="⏰" sub="within 90 days" />
        <Kpi title="Pending orders" value={d.pending_orders} icon="📋" />
        <Kpi title="Alerts" value={d.low_stock + d.expiring_soon} icon="🔴" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card"><h3 className="h-section">⚠️ Low stock</h3><div className="mt-2 space-y-1">{(d.low_list || []).map((x: any) => <div key={x.id} className="flex justify-between rounded-lg bg-amber-50 dark:bg-amber-900/20 p-2 text-sm"><span>{x.name}</span><b>{x.qty} left</b></div>)}{(d.low_list || []).length === 0 && <p className="text-sm text-slate-500">All good ✓</p>}</div></div>
        <div className="card"><h3 className="h-section">⏰ Expiring soon</h3><div className="mt-2 space-y-1">{(d.expiring_list || []).map((x: any) => <div key={x.id} className="flex justify-between rounded-lg bg-red-50 dark:bg-red-900/20 p-2 text-sm"><span>{x.name} · {x.batch}</span><b>{x.expiry}</b></div>)}{(d.expiring_list || []).length === 0 && <p className="text-sm text-slate-500">Nothing expiring ✓</p>}</div></div>
      </div>
    </div>
  );
}

// ================= LAB =================
export function LabDash() {
  const { lastEvent } = useLive();
  const [d, setD] = useState<any>(null);
  const load = async () => { try { const { data } = await api.get('/api/lab/overview'); setD(data); } catch {} };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (lastEvent?.event === 'lab_updated') load(); }, [lastEvent]);
  if (!d) return <Loading text="Loading laboratory…" />;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><h1 className="text-2xl font-black tracking-tight">🧪 Laboratory</h1><Ecg className="h-4 w-40 text-violet-500" /><p className="text-sm text-slate-500">Test → sample → result workflow</p></div>
        <Link to="/lab" className="btn-primary">Open lab bench</Link>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi title="Pending total" value={d.pending_total || 0} icon="📋" />
        <Kpi title="Awaiting sample" value={d.by_status?.requested || 0} icon="🧪" />
        <Kpi title="Processing" value={(d.by_status?.processing || 0) + (d.by_status?.sample_collected || 0)} icon="🔬" />
        <Kpi title="Done today" value={d.done_today || 0} icon="✅" />
        <Kpi title="Reviewed" value={d.by_status?.reviewed || 0} icon="📄" />
      </div>
      <div className="card"><h3 className="h-section">Workload by test</h3>
        <div className="h-56"><ResponsiveContainer><BarChart data={d.by_test || []} layout="vertical"><XAxis type="number" /><YAxis type="category" dataKey="name" width={170} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="value" fill="#8b5cf6" radius={4} /></BarChart></ResponsiveContainer></div></div>
    </div>
  );
}
