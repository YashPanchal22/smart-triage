import { useEffect, useState } from 'react';
import { api } from '../api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const MOODS = [[1, '😢', 'Very low'], [2, '😟', 'Low'], [3, '😐', 'Okay'], [4, '🙂', 'Good'], [5, '😄', 'Great']];

function Breathing() {
  const [on, setOn] = useState(false);
  const [phase, setPhase] = useState('Ready — press Start');
  useEffect(() => {
    if (!on) return;
    let i = 0;
    const seq = ['Breathe in… 4s', 'Hold… 2s', 'Breathe out… 6s', 'Rest…'];
    setPhase(seq[0]);
    const t = setInterval(() => { i = (i + 1) % seq.length; setPhase(seq[i]); }, 3000);
    return () => clearInterval(t);
  }, [on]);
  return (
    <div className="card text-center">
      <h3 className="font-bold">🫁 Breathing exercise (4-2-6)</h3>
      <div className={`mx-auto mt-3 grid h-32 w-32 place-items-center rounded-full bg-brand-100 dark:bg-brand-900/30 text-4xl transition-all duration-[3000ms] ${on ? 'scale-110' : ''}`}>🌬️</div>
      <p className="mt-2 font-semibold">{phase}</p>
      <button onClick={() => { setOn(!on); if (on) setPhase('Ready — press Start'); }} className="btn-primary mt-2">{on ? 'Stop' : 'Start'}</button>
    </div>
  );
}

export default function Wellness() {
  const [logs, setLogs] = useState<any[]>([]);
  const [sum, setSum] = useState<any>(null);
  const [mood, setMood] = useState(3);
  const [note, setNote] = useState('');
  const [sleep, setSleep] = useState('');

  const load = async () => {
    try { const [a, b] = await Promise.all([api.get('/api/wellness/logs'), api.get('/api/wellness/summary')]); setLogs(a.data); setSum(b.data); } catch {}
  };
  useEffect(() => { load(); }, []);
  const save = async (e: any) => {
    e.preventDefault();
    try { await api.post('/api/wellness/logs', { mood, note, sleep_hours: sleep ? Number(sleep) : null }); setNote(''); setSleep(''); load(); } catch {}
  };
  const del = async (id: number) => { await api.delete(`/api/wellness/logs/${id}`); load(); };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">💙 Mental Wellness Support</h1>
      <p className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-200">Self-care education only — this tool cannot assess mental health and never replaces professionals. In crisis, contact a trusted person or <b>Tele-MANAS 14416</b> (India, 24×7) immediately.</p>
      <div className="grid gap-4 lg:grid-cols-3">
        <form onSubmit={save} className="card space-y-3">
          <h3 className="font-bold">📓 Mood journal</h3>
          <div className="flex justify-between">{MOODS.map(([v, e, l]) => <button type="button" key={v} onClick={() => setMood(Number(v))} className={`rounded-xl border p-2 text-center ${mood === v ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/30' : 'border-slate-300 dark:border-slate-700'}`}><div className="text-2xl">{e}</div><div className="text-[10px]">{l}</div></button>)}</div>
          <div><label className="label">Note (optional)</label><textarea className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What influenced your mood today?" /></div>
          <div><label className="label">Sleep hours (optional)</label><input type="number" step="0.5" className="input" value={sleep} onChange={(e) => setSleep(e.target.value)} /></div>
          <button className="btn-primary w-full">Save entry</button>
          {sum && <p className="text-sm text-slate-500">Last 14 days: <b>{sum.count_14d}</b> entries · avg mood <b>{sum.avg_mood ?? '—'}</b></p>}
        </form>
        <div className="card">
          <h3 className="font-bold">📈 Mood trend</h3>
          <div className="h-56"><ResponsiveContainer><LineChart data={sum?.trend || []}><CartesianGrid strokeDasharray="3 3" opacity={.3} /><XAxis dataKey="at" tick={{ fontSize: 9 }} interval={2} /><YAxis domain={[1, 5]} /><Tooltip /><Line type="monotone" dataKey="mood" stroke="#8b5cf6" strokeWidth={2} /></LineChart></ResponsiveContainer></div>
          <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">{logs.slice(0, 20).map((l) => <div key={l.id} className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800 px-2 py-1 text-sm"><span>{MOODS[l.mood - 1]?.[1]} {l.mood}/5 · {l.note?.slice(0, 40)} <span className="text-xs text-slate-400">{l.at?.slice(0, 10)}</span></span><button onClick={() => del(l.id)} className="text-xs text-red-500">✕</button></div>)}</div>
        </div>
        <div className="space-y-4">
          <Breathing />
          <div className="card text-sm">
            <h3 className="font-bold">🌿 Self-care resources</h3>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>Fixed sleep & wake times; limit screens before bed.</li>
              <li>30-min daily walk; sunlight exposure.</li>
              <li>Talk to trusted family/friends; don't isolate.</li>
              <li>Limit alcohol/caffeine; eat regular meals.</li>
              <li>Persistent low mood 2+ weeks → see a counsellor/doctor.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
