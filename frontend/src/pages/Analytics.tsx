import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { Kpi, Loading } from '../components';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, CartesianGrid, Legend, ScatterChart, Scatter } from 'recharts';

const COLORS = ['#dc2626', '#f97316', '#eab308', '#10b981'];

export default function Analytics() {
  const [dist, setDist] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [ov, setOv] = useState<any>(null);
  const [ml, setMl] = useState<any>(null);
  const [pred, setPred] = useState<any>(null);
  const [predF, setPredF] = useState({ priority: 'urgent', queue_size: 12, dept_load: 4 });
  const [demand, setDemand] = useState<any>(null);
  const [apptStats, setApptStats] = useState<any>(null);
  const [blood, setBlood] = useState<any[]>([]);
  const [dq, setDq] = useState<any>(null);

  useEffect(() => {
    api.get('/api/analytics/distributions').then((r) => setDist(r.data));
    api.get('/api/analytics/trends').then((r) => setTrends(r.data));
    api.get('/api/analytics/overview').then((r) => setOv(r.data));
    api.get('/api/analytics/ml/metrics').then((r) => setMl(r.data)).catch(() => {});
    api.get('/api/analytics/ml/demand').then((r) => setDemand(r.data)).catch(() => {});
    api.get('/api/appointments/stats').then((r) => setApptStats(r.data)).catch(() => {});
    api.get('/api/blood/inventory').then((r) => setBlood(r.data)).catch(() => {});
    api.get('/api/analytics/data-quality').then((r) => setDq(r.data)).catch(() => {});
  }, []);

  const hist = useMemo(() => {
    if (!dist?.waits_sample) return [];
    const bins = [0, 5, 10, 15, 20, 30, 45, 60, 120];
    return bins.slice(0, -1).map((b, i) => ({ bin: `${b}–${bins[i + 1]}`, count: dist.waits_sample.filter((w: number) => w >= b && w < bins[i + 1]).length }));
  }, [dist]);
  const scatter = useMemo(() => (dist?.hourly || []).map((h: any, i: number) => ({ x: i, y: h.count })), [dist]);

  const train = async () => { try { const { data } = await api.post('/api/analytics/ml/train'); setMl(data); } catch (e: any) { alert(e?.response?.data?.detail || 'Training failed (admin/doctor only)'); } };
  const predict = async () => { try { const { data } = await api.post('/api/analytics/ml/predict', { ...predF, queue_size: Number(predF.queue_size), dept_load: Number(predF.dept_load) }); setPred(data); } catch {} };

  if (!dist || !ov) return <Loading text="Loading analytics…" />;
  const s = ov.waiting_stats_30d;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Data Analytics & ML <span className="text-sm font-normal text-slate-500">(synthetic demo data)</span></h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi title="Mean wait" value={`${s.mean} min`} icon="📊" />
        <Kpi title="Median wait" value={`${s.median} min`} icon="📐" />
        <Kpi title="Max wait" value={`${s.max} min`} icon="🔺" />
        <Kpi title="Sample size" value={s.count} icon="🧮" sub="completed visits, 30 days" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card"><h3 className="font-bold">Department Utilization</h3><div className="h-64"><ResponsiveContainer><BarChart data={dist.by_department} layout="vertical"><XAxis type="number" /><YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="value" fill="#8b5cf6" radius={4} /></BarChart></ResponsiveContainer></div></div>
        <div className="card"><h3 className="font-bold">30-Day Arrival Trend</h3><div className="h-64"><ResponsiveContainer><LineChart data={trends}><CartesianGrid strokeDasharray="3 3" opacity={.3} /><XAxis dataKey="date" tick={{ fontSize: 9 }} interval={4} /><YAxis /><Tooltip /><Line type="monotone" dataKey="arrivals" stroke="#10b981" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div></div>
        <div className="card"><h3 className="font-bold">Waiting-Time Histogram</h3><div className="h-64"><ResponsiveContainer><BarChart data={hist}><XAxis dataKey="bin" /><YAxis /><Tooltip /><Bar dataKey="count" fill="#f59e0b" radius={4} /></BarChart></ResponsiveContainer></div></div>
        <div className="card"><h3 className="font-bold">Arrivals by Hour (scatter)</h3><div className="h-64"><ResponsiveContainer><ScatterChart><CartesianGrid opacity={.3} /><XAxis dataKey="x" name="hour" /><YAxis dataKey="y" name="count" /><Tooltip cursor={{ strokeDasharray: '3 3' }} /><Scatter data={scatter} fill="#0d9488" /></ScatterChart></ResponsiveContainer></div></div>
        <div className="card"><h3 className="font-bold">Department Workload (live queue)</h3><div className="h-64"><ResponsiveContainer><BarChart data={dist.workload}><XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} height={60} /><YAxis /><Tooltip /><Bar dataKey="value" fill="#ef4444" radius={4} /></BarChart></ResponsiveContainer></div></div>
        <div className="card"><h3 className="font-bold">Completed vs Active (today)</h3><div className="h-64"><ResponsiveContainer><PieChart><Pie data={dist.completed_vs_waiting} dataKey="value" nameKey="name" outerRadius={80} label>{dist.completed_vs_waiting.map((_: any, i: number) => <Cell key={i} fill={['#10b981', '#f59e0b'][i % 2]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div></div>
      </div>
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold">🤖 ML: Waiting-Time Prediction <span className="text-xs font-normal text-slate-500">(estimate only — not a medical decision)</span></h3>
          <button onClick={train} className="btn-ghost">Retrain model</button>
        </div>
        <div className="mt-2 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4 text-sm">
            <b>Model evaluation</b>
            {ml?.status === 'trained' ? (
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-white dark:bg-slate-900 p-2"><div className="text-xl font-bold">{ml.mae}</div><div className="text-xs text-slate-500">MAE</div></div>
                <div className="rounded-lg bg-white dark:bg-slate-900 p-2"><div className="text-xl font-bold">{ml.rmse}</div><div className="text-xs text-slate-500">RMSE</div></div>
                <div className="rounded-lg bg-white dark:bg-slate-900 p-2"><div className="text-xl font-bold">{ml.r2}</div><div className="text-xs text-slate-500">R²</div></div>
              </div>
            ) : <p className="mt-1 text-slate-500">Model: {ml?.status || '…'} — click Retrain (admin/doctor).</p>}
            <p className="mt-2 text-xs text-slate-500">RandomForest on queue size, priority, dept load, arrival hour, doctor availability. {ml?.n ? `Trained on ${ml.n} visits.` : ''}</p>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4">
            <b className="text-sm">Predict estimated wait</b>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <select className="input" value={predF.priority} onChange={(e) => setPredF({ ...predF, priority: e.target.value })}><option value="emergency">🔴 Emergency</option><option value="urgent">🟠 Urgent</option><option value="semi_urgent">🟡 Semi-Urgent</option><option value="routine">🟢 Routine</option></select>
              <input type="number" className="input" title="Queue size" value={predF.queue_size} onChange={(e) => setPredF({ ...predF, queue_size: Number(e.target.value) })} />
              <input type="number" className="input" title="Dept load 1-6" value={predF.dept_load} onChange={(e) => setPredF({ ...predF, dept_load: Number(e.target.value) })} />
            </div>
            <button onClick={predict} className="btn-primary mt-2 w-full">Estimate ↓</button>
            {pred && <div className="mt-2 text-center"><div className="text-xs text-slate-500">Estimated Waiting Time ↓</div><div className="text-4xl font-bold text-brand-600">{pred.estimated_minutes} min</div><div className="text-xs text-slate-500">{pred.method} · {pred.disclaimer}</div></div>}
          </div>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {demand && (
          <div className="card"><h3 className="font-bold">📈 Hospital Demand Forecast (7-day, {demand.method})</h3>
            <div className="h-56"><ResponsiveContainer><BarChart data={demand.forecast_next_7}><XAxis dataKey="day" /><YAxis /><Tooltip /><Bar dataKey="estimate" fill="#0ea5e9" radius={4} /></BarChart></ResponsiveContainer></div>
            <p className="text-xs text-slate-500">{demand.note}</p></div>)}
        {apptStats && (
          <div className="card"><h3 className="font-bold">📅 Appointment Trends (7 days)</h3>
            <div className="h-56"><ResponsiveContainer><LineChart data={apptStats.daily}><CartesianGrid strokeDasharray="3 3" opacity={.3} /><XAxis dataKey="date" tick={{ fontSize: 9 }} /><YAxis /><Tooltip /><Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} /></LineChart></ResponsiveContainer></div></div>)}
        {blood.length > 0 && (
          <div className="card"><h3 className="font-bold">🩸 Blood-Group Inventory</h3>
            <div className="h-56"><ResponsiveContainer><BarChart data={blood.map((b: any) => ({ name: b.group, units: b.available }))}><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="units" fill="#dc2626" radius={4} /></BarChart></ResponsiveContainer></div></div>)}
        {dq && (
          <div className="card"><h3 className="font-bold">🧹 Data-Quality Snapshot (pandas)</h3>
            <p className="text-xs text-slate-500">Rows analysed: {dq.visits_rows} · Duplicates: {dq.duplicates}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-2"><b>Visits missing %</b>{Object.entries(dq.missing_pct || {}).map(([k, v]: any) => <div key={k}>{k}: {v}%</div>)}</div>
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-2"><b>Vitals missing %</b>{Object.entries(dq.vitals_missing_pct || {}).map(([k, v]: any) => <div key={k}>{k}: {v}%</div>)}</div>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">Pipeline: {(dq.steps || []).join(' → ')}</p></div>)}
      </div>
    </div>
  );
}
