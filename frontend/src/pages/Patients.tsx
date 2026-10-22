import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Empty, Loading } from '../components';
import { useAuth } from '../auth';

const blank = { full_name: '', age: 30, gender: 'Male', phone: '', email: '', address: '', emergency_contact_name: '', emergency_contact_phone: '', existing_conditions: '', allergies: '', medications: '' };

export default function Patients() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [show, setShow] = useState(false);
  const [f, setF] = useState<any>({ ...blank });
  const [depts, setDepts] = useState<any[]>([]);
  const [visitFor, setVisitFor] = useState<any>(null);
  const [visitDept, setVisitDept] = useState('');
  const [visitCc, setVisitCc] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/patients', { params: { search, limit, offset: page * limit } });
      setItems(data.items); setTotal(data.total);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { api.get('/api/departments').then((r) => setDepts(r.data)); }, []);
  useEffect(() => { setPage(0); }, [search]);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [search, page]);

  const save = async (e: any) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/api/patients', { ...f, age: Number(f.age) });
      setShow(false); setF({ ...blank }); load();
      alert(`Registered ${data.patient_code} — ${data.full_name}`);
    } catch (err: any) { alert(err?.response?.data?.detail || 'Failed to register'); }
  };
  const mkVisit = async () => {
    try {
      await api.post('/api/appointments', { patient_id: visitFor.id, department_id: visitDept ? Number(visitDept) : null, chief_complaint: visitCc });
      setVisitFor(null); setVisitCc(''); alert('Visit created — patient added to queue. Now perform triage.');
    } catch (err: any) { alert(err?.response?.data?.detail || 'Failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Patients <span className="text-sm font-normal text-slate-500">({total})</span></h1>
        <button onClick={() => setShow(true)} className="btn-primary">＋ Register patient</button>
      </div>
      <div className="card"><input className="input max-w-md" placeholder="🔍 Search by name, patient ID, or phone…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      {loading ? <Loading /> : items.length === 0 ? <Empty text="No patients found." /> : (
        <div className="card !p-0 overflow-x-auto"><table className="grid-table">
          <thead><tr><th>ID</th><th>Name</th><th>Age/Gender</th><th>Phone</th><th>Conditions</th><th>Registered</th><th></th></tr></thead>
          <tbody>{items.map((p) => (
            <tr key={p.id}>
              <td className="font-mono font-semibold">{p.patient_code}</td>
              <td><Link to={`/patients/${p.id}`} className="font-semibold text-brand-600">{p.full_name}</Link></td>
              <td>{p.age} / {p.gender}</td><td>{p.phone}</td>
              <td className="max-w-[180px] truncate text-xs">{p.existing_conditions || '—'}</td>
              <td className="text-xs">{p.created_at?.slice(0, 10)}</td>
              <td><div className="flex gap-1">
                <Link to={`/patients/${p.id}`} className="btn-ghost !px-2 !py-1 text-xs">Open</Link>
                {user?.role !== 'patient' && <button onClick={() => setVisitFor(p)} className="rounded-lg bg-brand-600 px-2 py-1 text-xs font-semibold text-white">＋ Visit</button>}
              </div></td>
            </tr>))}</tbody>
        </table></div>
      )}
      <div className="flex items-center gap-2 text-sm">
        <button disabled={page === 0} onClick={() => setPage(page - 1)} className="btn-ghost">← Prev</button>
        <span>Page {page + 1} of {Math.max(1, Math.ceil(total / limit))}</span>
        <button disabled={(page + 1) * limit >= total} onClick={() => setPage(page + 1)} className="btn-ghost">Next →</button>
      </div>

      {show && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/50 p-4" onClick={() => setShow(false)}>
          <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="card max-h-[90vh] w-full max-w-2xl space-y-3 overflow-y-auto">
            <h2 className="text-lg font-bold">Register patient</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="label">Full name *</label><input required className="input" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></div>
              <div><label className="label">Age *</label><input type="number" required className="input" value={f.age} onChange={(e) => setF({ ...f, age: e.target.value })} /></div>
              <div><label className="label">Gender</label><select className="input" value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })}><option>Male</option><option>Female</option><option>Other</option></select></div>
              <div><label className="label">Phone</label><input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
              <div><label className="label">Email</label><input className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
              <div className="col-span-2"><label className="label">Address</label><input className="input" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></div>
              <div><label className="label">Emergency contact name</label><input className="input" value={f.emergency_contact_name} onChange={(e) => setF({ ...f, emergency_contact_name: e.target.value })} /></div>
              <div><label className="label">Emergency contact phone</label><input className="input" value={f.emergency_contact_phone} onChange={(e) => setF({ ...f, emergency_contact_phone: e.target.value })} /></div>
              <div><label className="label">Existing conditions</label><input className="input" value={f.existing_conditions} onChange={(e) => setF({ ...f, existing_conditions: e.target.value })} /></div>
              <div><label className="label">Allergies</label><input className="input" value={f.allergies} onChange={(e) => setF({ ...f, allergies: e.target.value })} /></div>
              <div className="col-span-2"><label className="label">Current medications</label><input className="input" value={f.medications} onChange={(e) => setF({ ...f, medications: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setShow(false)} className="btn-ghost">Cancel</button><button className="btn-primary">Register</button></div>
          </form>
        </div>
      )}
      {visitFor && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/50 p-4" onClick={() => setVisitFor(null)}>
          <div onClick={(e) => e.stopPropagation()} className="card w-full max-w-md space-y-3">
            <h2 className="text-lg font-bold">New visit — {visitFor.full_name}</h2>
            <div><label className="label">Department</label><select className="input" value={visitDept} onChange={(e) => setVisitDept(e.target.value)}><option value="">— Select —</option>{depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
            <div><label className="label">Chief complaint</label><input className="input" value={visitCc} onChange={(e) => setVisitCc(e.target.value)} placeholder="e.g. Fever and body ache" /></div>
            <div className="flex justify-end gap-2"><button onClick={() => setVisitFor(null)} className="btn-ghost">Cancel</button><button onClick={mkVisit} className="btn-primary">Create visit</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
