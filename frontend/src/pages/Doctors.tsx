import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { Empty } from '../components';

export default function Doctors() {
  const [docs, setDocs] = useState<any[]>([]);
  const [depts, setDepts] = useState<any[]>([]);
  const [dep, setDep] = useState('');
  const [show, setShow] = useState(false);
  const [f, setF] = useState<any>({ full_name: '', department_id: '', specialization: '', license_no: '', phone: '', available: true });
  const { user } = useAuth();
  const load = async () => {
    const { data } = await api.get('/api/doctors', { params: dep ? { department_id: dep } : {} });
    setDocs(data);
  };
  useEffect(() => { api.get('/api/departments').then((r) => setDepts(r.data)); }, []);
  useEffect(() => { load(); }, [dep]);
  const toggle = async (d: any) => { await api.patch(`/api/doctors/${d.id}`, { available: !d.available }); load(); };
  const save = async (e: any) => {
    e.preventDefault();
    try { await api.post('/api/doctors', { ...f, department_id: f.department_id ? Number(f.department_id) : null }); setShow(false); load(); }
    catch (err: any) { alert(err?.response?.data?.detail || 'Failed'); }
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Doctors & Departments</h1>
        {user?.role === 'admin' && <button onClick={() => setShow(true)} className="btn-primary">＋ Add doctor</button>}
      </div>
      <div className="card flex flex-wrap gap-2">
        <select className="input max-w-xs" value={dep} onChange={(e) => setDep(e.target.value)}><option value="">All departments</option>{depts.map((d) => <option key={d.id} value={d.id}>{d.name} (cap {d.capacity})</option>)}</select>
        <span className="text-sm text-slate-500 self-center">Available: {docs.filter((d) => d.available).length} / {docs.length}</span>
      </div>
      {docs.length === 0 ? <Empty text="No doctors found." /> : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {docs.map((d) => (
            <div key={d.id} className="card">
              <div className="flex items-start justify-between">
                <div><p className="font-bold">{d.full_name}</p><p className="text-sm text-slate-500">{d.specialization} · {d.department}</p><p className="text-xs text-slate-500">{d.license_no} · {d.phone}</p></div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${d.available ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-200 text-slate-600'}`}>{d.available ? '● Available' : '○ Off'}</span>
              </div>
              {user?.role !== 'patient' && <button onClick={() => toggle(d)} className="btn-ghost mt-2 w-full !py-1 text-xs">{d.available ? 'Mark unavailable' : 'Mark available'}</button>}
            </div>))}
        </div>)}
      {show && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/50 p-4" onClick={() => setShow(false)}>
          <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="card w-full max-w-md space-y-3">
            <h2 className="text-lg font-bold">Add doctor</h2>
            <input required placeholder="Full name" className="input" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} />
            <select className="input" value={f.department_id} onChange={(e) => setF({ ...f, department_id: e.target.value })}><option value="">— Department —</option>{depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
            <input placeholder="Specialization" className="input" value={f.specialization} onChange={(e) => setF({ ...f, specialization: e.target.value })} />
            <input required placeholder="License no." className="input" value={f.license_no} onChange={(e) => setF({ ...f, license_no: e.target.value })} />
            <input placeholder="Phone" className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setShow(false)} className="btn-ghost">Cancel</button><button className="btn-primary">Save</button></div>
          </form>
        </div>)}
    </div>
  );
}
