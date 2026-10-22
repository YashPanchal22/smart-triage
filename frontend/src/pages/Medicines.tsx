import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Medicines() {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [sel, setSel] = useState<any>(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      try { const { data } = await api.get('/api/medicines', { params: { search: q, category: cat } }); setRows(data); } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [q, cat]);

  const cats = [...new Set(rows.map((r) => r.category))];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">💊 Medicine Information</h1>
      <p className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-200">Reference information only — this system never prescribes medicines or dosages. Always follow your doctor's prescription and pharmacist's guidance.</p>
      <div className="card flex flex-wrap gap-2">
        <input className="input max-w-sm" placeholder="🔍 Search name / generic / brand / use…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input max-w-[220px]" value={cat} onChange={(e) => setCat(e.target.value)}><option value="">All categories</option>{cats.map((c) => <option key={c} value={c}>{c}</option>)}</select>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">{rows.map((m) => (
          <button key={m.id} onClick={() => setSel(m)} className={`card w-full !p-3 text-left ${sel?.id === m.id ? '!border-brand-500 border-2' : ''}`}>
            <b>{m.name}</b> <span className="text-sm text-slate-500">({m.generic})</span>
            <div className="text-xs text-slate-500">{m.category} · Brands: {m.brands}</div>
          </button>))}
          {rows.length === 0 && <p className="text-sm text-slate-500">No medicines found.</p>}</div>
        <div className="card h-fit lg:sticky lg:top-20">
          {!sel ? <p className="text-sm text-slate-500">Select a medicine to view details.</p> : (
            <div className="text-sm">
              <h3 className="text-lg font-bold">{sel.name} <span className="text-sm font-normal text-slate-500">· {sel.generic}</span></h3>
              <p className="text-slate-500">{sel.category} · Brands: {sel.brands}</p>
              <div className="mt-2 space-y-2">
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3"><b>General uses</b><p>{sel.uses}</p></div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3"><b>Safety information</b><p>{sel.safety}</p></div>
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3"><b>⚠️ Warnings</b><p>{sel.warnings}</p></div>
                <p className="text-xs text-slate-500">Manufacturer: {sel.manufacturer} · 📖 {sel.source}</p>
              </div>
            </div>)}
        </div>
      </div>
    </div>
  );
}
