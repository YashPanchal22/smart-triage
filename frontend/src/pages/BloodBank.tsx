import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { useLive } from '../live';
import { Empty } from '../components';

export default function BloodBank() {
  const { user } = useAuth();
  const { lastEvent } = useLive();
  const [inv, setInv] = useState<any[]>([]);
  const [donors, setDonors] = useState<any[]>([]);
  const [reqs, setReqs] = useState<any[]>([]);
  const [dSearch, setDSearch] = useState('');
  const [dGroup, setDGroup] = useState('');
  const [showDonor, setShowDonor] = useState(false);
  const [showReq, setShowReq] = useState(false);
  const [df, setDf] = useState({ full_name: '', blood_group: 'O+', phone: '', gender: 'Male', age: 25 });
  const [rf, setRf] = useState({ hospital_unit: 'Emergency', blood_group: 'O+', units: 2, priority: 'urgent' });
  const canManage = ['admin', 'blood'].includes(user?.role || '');

  const load = async () => {
    try {
      const [a, b, c] = await Promise.all([
        api.get('/api/blood/inventory'),
        api.get('/api/blood/donors', { params: { search: dSearch, group: dGroup } }),
        api.get('/api/blood/requests'),
      ]);
      setInv(a.data); setDonors(b.data); setReqs(c.data);
    } catch {}
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { const t = setTimeout(load, 350); return () => clearTimeout(t); }, [dSearch, dGroup]);
  useEffect(() => { if (lastEvent?.event === 'blood_updated') load(); }, [lastEvent]);

  const addDonor = async (e: any) => {
    e.preventDefault();
    try { await api.post('/api/blood/donors', { ...df, age: Number(df.age) }); setShowDonor(false); load(); } catch (err: any) { alert(err?.response?.data?.detail || 'Failed'); }
  };
  const addReq = async (e: any) => {
    e.preventDefault();
    try { await api.post('/api/blood/requests', { ...rf, units: Number(rf.units) }); setShowReq(false); load(); } catch (err: any) { alert(err?.response?.data?.detail || 'Failed'); }
  };
  const setReqStatus = async (id: number, status: string) => {
    try { await api.patch(`/api/blood/requests/${id}`, { status }); load(); } catch (err: any) { alert(err?.response?.data?.detail || 'Failed'); }
  };
  const adjust = async (g: string, delta: number) => {
    const row = inv.find((x) => x.group === g);
    try { await api.patch(`/api/blood/inventory/${g}`, { units_available: Math.max(0, row.available + delta) }); load(); } catch (err: any) { alert(err?.response?.data?.detail || 'Failed'); }
  };

  const total = inv.reduce((s, x) => s + x.available, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">🩸 Blood Bank <span className="text-sm font-normal text-slate-500">· {total} units total · synthetic demo</span></h1>
        <div className="flex gap-2">
          {canManage && <button onClick={() => setShowDonor(true)} className="btn-ghost">＋ Donor</button>}
          <button onClick={() => setShowReq(true)} className="btn-primary">＋ Blood request</button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {inv.map((x) => (
          <div key={x.group} className={`card text-center ${x.available < 5 ? 'border-red-400 !border-2' : ''}`}>
            <p className="text-3xl font-bold text-red-600">{x.group}</p>
            <p className="text-xl font-bold">{x.available} <span className="text-sm font-normal text-slate-500">units</span></p>
            <p className="text-xs text-slate-500">reserved: {x.reserved} {x.available < 5 && '⚠️ low'}</p>
            {canManage && <div className="mt-1 flex justify-center gap-1"><button onClick={() => adjust(x.group, 1)} className="rounded bg-emerald-600 px-2 py-0.5 text-xs text-white">+1</button><button onClick={() => adjust(x.group, -1)} className="rounded bg-stone-500 px-2 py-0.5 text-xs text-white">−1</button></div>}
          </div>))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h3 className="font-bold">Requests</h3>
          {reqs.length === 0 ? <div className="mt-2"><Empty text="No requests." /></div> : (
            <div className="mt-2 max-h-96 space-y-2 overflow-y-auto">{reqs.slice(0, 60).map((r) => (
              <div key={r.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 text-sm">
                <b>#{r.id}</b> · <b className="text-red-600">{r.blood_group}</b> × {r.units} · {r.hospital_unit} · {r.priority} · <b>{r.status}</b>
                {canManage && r.status === 'requested' && <span className="ml-2"><button onClick={() => setReqStatus(r.id, 'approved')} className="rounded bg-brand-600 px-2 py-0.5 text-xs text-white">Approve</button> <button onClick={() => setReqStatus(r.id, 'rejected')} className="rounded bg-stone-500 px-2 py-0.5 text-xs text-white">Reject</button></span>}
                {canManage && r.status === 'approved' && <button onClick={() => setReqStatus(r.id, 'issued')} className="ml-2 rounded bg-emerald-600 px-2 py-0.5 text-xs text-white">Issue units</button>}
                {canManage && r.status === 'issued' && <button onClick={() => setReqStatus(r.id, 'fulfilled')} className="ml-2 rounded bg-slate-600 px-2 py-0.5 text-xs text-white">Fulfill</button>}
              </div>))}</div>)}
        </div>
        <div className="card">
          <h3 className="font-bold">Donors ({donors.length})</h3>
          <div className="mt-2 flex gap-2">
            <input className="input" placeholder="Search donor…" value={dSearch} onChange={(e) => setDSearch(e.target.value)} />
            <select className="input max-w-[110px]" value={dGroup} onChange={(e) => setDGroup(e.target.value)}><option value="">All</option>{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => <option key={g} value={g}>{g}</option>)}</select>
          </div>
          <div className="mt-2 max-h-96 overflow-y-auto"><table className="grid-table">
            <thead><tr><th>Name</th><th>Group</th><th>Phone</th><th>Donations</th></tr></thead>
            <tbody>{donors.slice(0, 80).map((d) => <tr key={d.id}><td className="font-medium">{d.full_name}</td><td className="font-bold text-red-600">{d.blood_group}</td><td>{d.phone}</td><td>{d.donations_count}</td></tr>)}</tbody>
          </table></div>
          <p className="mt-2 text-xs text-slate-500">Eligibility (general education): age 18–65, weight ≥50kg, feeling healthy, 3+ months since last donation. Final eligibility is always decided by blood-bank medical staff.</p>
        </div>
      </div>
      {showDonor && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/50 p-4" onClick={() => setShowDonor(false)}>
          <form onSubmit={addDonor} onClick={(e) => e.stopPropagation()} className="card w-full max-w-md space-y-3">
            <h2 className="font-bold">Register donor</h2>
            <input required className="input" placeholder="Full name" value={df.full_name} onChange={(e) => setDf({ ...df, full_name: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <select className="input" value={df.blood_group} onChange={(e) => setDf({ ...df, blood_group: e.target.value })}>{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => <option key={g}>{g}</option>)}</select>
              <input className="input" placeholder="Phone" value={df.phone} onChange={(e) => setDf({ ...df, phone: e.target.value })} />
              <select className="input" value={df.gender} onChange={(e) => setDf({ ...df, gender: e.target.value })}><option>Male</option><option>Female</option><option>Other</option></select>
              <input type="number" className="input" placeholder="Age" value={df.age} onChange={(e) => setDf({ ...df, age: Number(e.target.value) })} />
            </div>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowDonor(false)} className="btn-ghost">Cancel</button><button className="btn-primary">Save</button></div>
          </form>
        </div>)}
      {showReq && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/50 p-4" onClick={() => setShowReq(false)}>
          <form onSubmit={addReq} onClick={(e) => e.stopPropagation()} className="card w-full max-w-md space-y-3">
            <h2 className="font-bold">Blood request</h2>
            <input className="input" placeholder="Hospital unit (e.g. Emergency)" value={rf.hospital_unit} onChange={(e) => setRf({ ...rf, hospital_unit: e.target.value })} />
            <div className="grid grid-cols-3 gap-2">
              <select className="input" value={rf.blood_group} onChange={(e) => setRf({ ...rf, blood_group: e.target.value })}>{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => <option key={g}>{g}</option>)}</select>
              <input type="number" min={1} className="input" value={rf.units} onChange={(e) => setRf({ ...rf, units: Number(e.target.value) })} />
              <select className="input" value={rf.priority} onChange={(e) => setRf({ ...rf, priority: e.target.value })}><option value="emergency">Emergency</option><option value="urgent">Urgent</option><option value="routine">Routine</option></select>
            </div>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowReq(false)} className="btn-ghost">Cancel</button><button className="btn-primary">Submit</button></div>
          </form>
        </div>)}
    </div>
  );
}
