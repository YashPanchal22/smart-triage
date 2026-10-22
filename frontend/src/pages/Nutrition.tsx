import { useEffect, useState } from 'react';
import { api } from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const LANGS = [['en', 'English'], ['hi', 'हिंदी'], ['gu', 'ગુજરાતી']];
const GROUPS = [['', 'All'], ['maternal', '🤰 Maternal'], ['child', '👶 Child'], ['general', '🥗 General']];
const PLATE = [{ name: 'Cereals/roti', value: 35 }, { name: 'Vegetables', value: 25 }, { name: 'Protein (dal/eggs)', value: 20 }, { name: 'Salad/fruit', value: 15 }, { name: 'Milk/curd', value: 5 }];
const COLORS = ['#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#3b82f6'];
const GROWTH = [{ age: '0m', wt: 3.2 }, { age: '6m', wt: 7.5 }, { age: '12m', wt: 9.5 }, { age: '18m', wt: 11 }, { age: '24m', wt: 12.2 }];

export default function Nutrition() {
  const [lang, setLang] = useState('en');
  const [group, setGroup] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [meals, setMeals] = useState<any[]>([]);
  const [bmi, setBmi] = useState<any>(null);
  const [h, setH] = useState('160');
  const [w, setW] = useState('55');

  useEffect(() => { api.get('/api/nutrition', { params: { lang, group } }).then((r) => setItems(r.data)).catch(() => {}); }, [lang, group]);
  useEffect(() => { api.get('/api/nutrition/meals').then((r) => setMeals(r.data)).catch(() => {}); }, []);

  const calc = () => {
    const hm = Number(h) / 100;
    if (!hm || !Number(w)) return;
    const v = Number(w) / (hm * hm);
    setBmi({ v: v.toFixed(1), band: v < 18.5 ? 'Underweight range' : v < 25 ? 'Healthy range' : v < 30 ? 'Overweight range' : 'Obese range' });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">🥗 Maternal & Child Nutrition</h1>
        <div className="flex gap-1">{LANGS.map(([v, l]) => <button key={v} onClick={() => setLang(v)} className={`rounded-full px-3 py-1 text-xs font-bold ${lang === v ? 'bg-brand-600 text-white' : 'border border-slate-300 dark:border-slate-700'}`}>{l}</button>)}</div>
      </div>
      <p className="text-sm text-slate-500">Educational nutrition guidance only — not medical treatment. For anaemia, poor growth, or pregnancy complications, please consult qualified professionals.</p>
      <div className="flex gap-1">{GROUPS.map(([v, l]) => <button key={v} onClick={() => setGroup(v)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${group === v ? 'bg-emerald-600 text-white' : 'border border-slate-300 dark:border-slate-700'}`}>{l}</button>)}</div>
      <div className="grid gap-3 md:grid-cols-3">{items.map((n) => (
        <div key={n.id} className="card"><p className="font-bold">{n.title}</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{n.body}</p><p className="mt-1 text-[11px] text-slate-400">📖 {n.source}</p></div>))}</div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card">
          <h3 className="font-bold">🍛 Affordable meal ideas</h3>
          <div className="mt-2 space-y-2">{meals.map((m, i) => <div key={i} className="rounded-xl bg-slate-50 dark:bg-slate-800 p-2.5 text-sm"><b>{lang === 'hi' ? m.hi : m.en}</b><p className="text-slate-500">{lang === 'hi' ? m.hi_detail : m.en_detail}</p></div>)}</div>
        </div>
        <div className="card">
          <h3 className="font-bold">🍽️ Balanced plate (education)</h3>
          <div className="h-56"><ResponsiveContainer><PieChart><Pie data={PLATE} dataKey="value" nameKey="name" outerRadius={75} label>{PLATE.map((_, i) => <Cell key={i} fill={COLORS[i % 5]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
        </div>
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-bold">📏 Growth reference (illustrative)</h3>
            <div className="h-44"><ResponsiveContainer><BarChart data={GROWTH}><XAxis dataKey="age" /><YAxis /><Tooltip /><Bar dataKey="wt" fill="#10b981" radius={4} /></BarChart></ResponsiveContainer></div>
            <p className="text-xs text-slate-500">Illustrative average weights (kg). Real growth monitoring uses WHO charts by trained workers.</p>
          </div>
          <div className="card">
            <h3 className="font-bold">🧮 BMI calculator (education)</h3>
            <div className="mt-2 flex gap-2"><input className="input" placeholder="Height cm" value={h} onChange={(e) => setH(e.target.value)} /><input className="input" placeholder="Weight kg" value={w} onChange={(e) => setW(e.target.value)} /><button onClick={calc} className="btn-primary">Go</button></div>
            {bmi && <p className="mt-2 text-sm">BMI <b>{bmi.v}</b> — {bmi.band} (general screening only)</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
