import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { DISCLAIMER } from '../components';

const LANGS = [['en', 'English'], ['hi', 'हिंदी'], ['gu', 'ગુજરાતી']];
const SUGGEST = ['I have fever, what should I know?', 'Tell me about ORS for diarrhoea', 'Diabetes lifestyle tips', 'Child vaccination schedule info', 'How to manage stress and sleep?', 'Medicine safety rules', 'First aid for bleeding', 'Mosquito protection tips'];

export default function Assistant() {
  const [lang, setLang] = useState('en');
  const [msgs, setMsgs] = useState<any[]>([{ from: 'bot', text: '🙏 Welcome to the AI Health Awareness Assistant. Ask me about fever, ORS, diabetes, BP, vaccination, pregnancy care, nutrition, hygiene, stress, medicine safety, first aid — in English, हिंदी or ગુજરાતી.' }]);
  const [inp, setInp] = useState('');
  const [busy, setBusy] = useState(false);
  const [sid, setSid] = useState<number | null>(null);
  const [arts, setArts] = useState<any[]>([]);
  const [cat, setCat] = useState('');
  const [q, setQ] = useState('');
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);
  useEffect(() => {
    const t = setTimeout(async () => {
      try { const { data } = await api.get('/api/articles', { params: { lang, category: cat, search: q } }); setArts(data); } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [lang, cat, q]);

  const send = async (text?: string) => {
    const m = (text ?? inp).trim();
    if (!m || busy) return;
    setInp(''); setMsgs((p) => [...p, { from: 'user', text: m }]); setBusy(true);
    try {
      const { data } = await api.post('/api/assistant/chat', { message: m, lang, session_id: sid });
      setSid(data.session_id);
      setMsgs((p) => [...p, { from: 'bot', text: data.reply, emergency: data.emergency, sources: data.sources }]);
    } catch { setMsgs((p) => [...p, { from: 'bot', text: 'Sorry, something went wrong. Please try again.' }]); }
    finally { setBusy(false); }
  };

  const cats = ['', 'general', 'chronic', 'maternal', 'child', 'nutrition', 'prevention', 'mental', 'medicines', 'emergency'];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">🤖 AI Health Awareness Assistant</h1>
        <div className="flex gap-1">{LANGS.map(([v, l]) => <button key={v} onClick={() => setLang(v)} className={`rounded-full px-3 py-1 text-xs font-bold ${lang === v ? 'bg-brand-600 text-white' : 'border border-slate-300 dark:border-slate-700'}`}>{l}</button>)}</div>
      </div>
      <p className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-200">📚 {DISCLAIMER} Answers come only from a curated knowledge base with sources. If you describe an emergency, you'll be directed to immediate professional help. Emergency: 108/112 (India).</p>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card flex h-[560px] flex-col">
          <h3 className="font-bold">💬 Chat</h3>
          <div className="mt-2 flex-1 space-y-2 overflow-y-auto rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
            {msgs.map((m, i) => (
              <div key={i} className={`max-w-[90%] whitespace-pre-wrap rounded-xl p-2.5 text-sm ${m.from === 'user' ? 'ml-auto bg-brand-600 text-white' : m.emergency ? 'bg-red-100 dark:bg-red-900/50 border border-red-400' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700'}`}>
                {m.text}
                {m.sources?.length > 0 && <div className="mt-1 text-[11px] opacity-70">📖 Source: {m.sources.join(' · ')}</div>}
              </div>))}
            {busy && <div className="text-sm text-slate-500 animate-pulse">Typing…</div>}
            <div ref={bottom} />
          </div>
          <div className="mt-2 flex flex-wrap gap-1">{SUGGEST.slice(0, 4).map((s) => <button key={s} onClick={() => send(s)} className="rounded-full border border-slate-300 dark:border-slate-700 px-2 py-1 text-[11px]">{s}</button>)}</div>
          <div className="mt-2 flex gap-2">
            <input className="input" value={inp} onChange={(e) => setInp(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Ask a health-education question…" />
            <button onClick={() => send()} disabled={busy} className="btn-primary">Send</button>
          </div>
        </div>
        <div className="card h-[560px] overflow-y-auto">
          <h3 className="font-bold">📖 Knowledge Base</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <input className="input max-w-[200px]" placeholder="Search articles…" value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="input max-w-[160px]" value={cat} onChange={(e) => setCat(e.target.value)}>{cats.map((c) => <option key={c} value={c}>{c || 'All topics'}</option>)}</select>
          </div>
          <div className="mt-3 space-y-2">{arts.map((a) => (
            <div key={a.slug} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
              <p className="font-semibold">{a.title} <span className="ml-1 rounded bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 text-[10px]">{a.category}</span></p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{a.body}</p>
              <p className="mt-1 text-[11px] text-slate-400">📖 {a.source}</p>
            </div>))}
            {arts.length === 0 && <p className="text-sm text-slate-500">No articles found.</p>}</div>
        </div>
      </div>
    </div>
  );
}
