import { useEffect, useState } from 'react';
import { api } from '../api';

const LANGS = [['en', 'English'], ['hi', 'हिंदी'], ['gu', 'ગુજરાતી']];
const TYPES = [['', 'All services'], ['hospital', '🏥 Hospital'], ['clinic', '🩺 Clinic'], ['pharmacy', '💊 Pharmacy'], ['blood_bank', '🩸 Blood Bank'], ['diagnostic', '🔬 Diagnostic'], ['emergency', '🚨 Emergency']];

export default function Rural() {
  const [lang, setLang] = useState('en');
  const [arts, setArts] = useState<any[]>([]);
  const [svcs, setSvcs] = useState<any[]>([]);
  const [type, setType] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    api.get('/api/articles', { params: { lang } }).then((r) => setArts(r.data)).catch(() => {});
  }, [lang]);
  useEffect(() => {
    const t = setTimeout(async () => {
      try { const { data } = await api.get('/api/services', { params: { type, search: q } }); setSvcs(data); } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [type, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">🌾 Rural Healthcare Assistant</h1>
        <div className="flex gap-1">{LANGS.map(([v, l]) => <button key={v} onClick={() => setLang(v)} className={`rounded-full px-3 py-1 text-xs font-bold ${lang === v ? 'bg-brand-600 text-white' : 'border border-slate-300 dark:border-slate-700'}`}>{l}</button>)}</div>
      </div>
      <p className="text-sm text-slate-500">Simple, low-bandwidth-friendly health education + nearby service directory. Educational only — not a diagnosis.</p>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h3 className="font-bold">📚 Health education</h3>
          <div className="mt-2 max-h-[520px] space-y-2 overflow-y-auto">{arts.map((a) => (
            <details key={a.slug} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
              <summary className="cursor-pointer font-semibold">{a.title}</summary>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{a.body}</p>
              <p className="mt-1 text-[11px] text-slate-400">📖 {a.source}</p>
            </details>))}</div>
        </div>
        <div className="space-y-3">
          <div className="card">
            <h3 className="font-bold">🗺️ Service directory <span className="text-xs font-normal text-slate-500">(demo data)</span></h3>
            <div className="mt-2 flex gap-2">
              <select className="input max-w-[170px]" value={type} onChange={(e) => setType(e.target.value)}>{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
              <input className="input" placeholder="Search place / name…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="mt-2 max-h-[380px] space-y-2 overflow-y-auto">{svcs.map((s) => (
              <div key={s.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 text-sm">
                <b>{s.name}</b> <span className="rounded bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 text-[10px]">{s.type}</span>
                <div className="text-slate-500">📍 {s.place} · 📞 {s.phone} · 🕒 {s.hours}</div>
                <div className="text-xs">{s.services}</div>
              </div>))}
              {svcs.length === 0 && <p className="text-sm text-slate-500">No services found.</p>}</div>
          </div>
          <div className="card border-red-300 dark:border-red-800">
            <h3 className="font-bold">🚨 Emergency guidance</h3>
            <ul className="mt-1 list-disc pl-5 text-sm">
              <li>Call <b>108 / 112</b> for ambulance & emergency help.</li>
              <li>Severe bleeding: press firmly with a clean cloth.</li>
              <li>Burns: cool under running water; no ice/toothpaste.</li>
              <li>Snake/animal bite, poisoning, labour emergency → nearest hospital immediately.</li>
              <li>Crisis support: <b>Tele-MANAS 14416</b> (24×7).</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
