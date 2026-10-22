import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';

const MODELS = [['logistic', 'Logistic Regression'], ['rf', 'Random Forest'], ['tree', 'Decision Tree']];

export default function RiskLab() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>({});
  const [busy, setBusy] = useState('');
  const [f, setF] = useState({ age: 52, bmi: 29, glucose: 145, bp: 140, family_history: 1, smoker: 0, model: 'logistic' });
  const [pred, setPred] = useState<any>(null);
  const canTrain = ['admin', 'doctor'].includes(user?.role || '');

  const load = async () => { try { const { data } = await api.get('/api/ml/risk/metrics'); setMetrics(data.status ? {} : data); } catch {} };
  useEffect(() => { load(); }, []);

  const train = async (model: string) => {
    setBusy(model);
    try { await api.post('/api/ml/risk/train', { model }); await load(); } catch (err: any) { alert(err?.response?.data?.detail || 'Training failed (admin/doctor only)'); }
    finally { setBusy(''); }
  };
  const predict = async (e: any) => {
    e.preventDefault();
    try { const { data } = await api.post('/api/ml/risk/predict', f); setPred(data); } catch (err: any) { alert(err?.response?.data?.detail || 'Train the model first'); }
  };

  const cm = (m: any) => {
    if (!m?.confusion_matrix) return null;
    const [[tn, fp], [fn, tp]] = m.confusion_matrix;
    const max = Math.max(tn, fp, fn, tp, 1);
    const cell = (v: number, label: string) => <div className="rounded-xl p-3 text-center text-white" style={{ background: `rgba(37,99,235,${0.25 + 0.75 * (v / max)})` }}><div className="text-2xl font-bold">{v}</div><div className="text-[11px]">{label}</div></div>;
    return <div><div className="grid grid-cols-2 gap-2">{cell(tn, 'TN: low, pred low')}{cell(fp, 'FP: low, pred high')}{cell(fn, 'FN: high, pred low')}{cell(tp, 'TP: high, pred high')}</div><p className="mt-1 text-[11px] text-slate-500">Rows = actual (low / high) · Cols = predicted</p></div>;
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">🧬 Health Risk Analytics Lab <span className="text-sm font-normal text-slate-500">(synthetic data · educational)</span></h1>
      <p className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-200">Pipeline: synthetic dataset → cleaning → features → ML → <b>risk estimate</b> → metrics. Output is a model-based estimate for education/research — <b>never a diagnosis</b>.</p>
      <div className="grid gap-4 lg:grid-cols-3">
        {MODELS.map(([k, label]) => {
          const m = metrics[k];
          return (
            <div key={k} className="card">
              <div className="flex items-center justify-between"><h3 className="font-bold">{label}</h3><button disabled={!canTrain || busy === k} onClick={() => train(k)} className="btn-ghost !py-1 text-xs">{busy === k ? 'Training…' : 'Train'}</button></div>
              {!m ? <p className="mt-2 text-sm text-slate-500">Not trained yet.</p> : (
                <div className="mt-2">
                  <div className="grid grid-cols-3 gap-1.5 text-center text-sm">
                    {[['Accuracy', m.accuracy], ['Precision', m.precision], ['Recall', m.recall], ['F1', m.f1], ['ROC-AUC', m.roc_auc], ['n', m.n]].map(([l, v]) => <div key={l as string} className="rounded-lg bg-slate-50 dark:bg-slate-800 p-1.5"><div className="font-bold">{v as any}</div><div className="text-[10px] text-slate-500">{l}</div></div>)}
                  </div>
                  <div className="mt-2">{cm(m)}</div>
                </div>)}
            </div>);
        })}
      </div>
      <form onSubmit={predict} className="card">
        <h3 className="font-bold">Try a risk estimate (demo inputs)</h3>
        <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
          {[['age', 'Age'], ['bmi', 'BMI'], ['glucose', 'Glucose'], ['bp', 'BP systolic']].map(([k, l]) => <div key={k}><label className="label">{l}</label><input type="number" step="any" className="input" value={(f as any)[k]} onChange={(e) => setF({ ...f, [k]: Number(e.target.value) })} /></div>)}
          <div><label className="label">Family history</label><select className="input" value={f.family_history} onChange={(e) => setF({ ...f, family_history: Number(e.target.value) })}><option value={0}>No</option><option value={1}>Yes</option></select></div>
          <div><label className="label">Smoker</label><select className="input" value={f.smoker} onChange={(e) => setF({ ...f, smoker: Number(e.target.value) })}><option value={0}>No</option><option value={1}>Yes</option></select></div>
          <div><label className="label">Model</label><select className="input" value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })}>{MODELS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
          <div className="flex items-end"><button className="btn-primary w-full">Estimate</button></div>
        </div>
        {pred && <div className="mt-3 rounded-xl bg-slate-50 dark:bg-slate-800 p-4 text-center"><p className="text-sm text-slate-500">Model-based risk estimate ↓</p><p className="text-2xl font-bold text-brand-600">{pred.band} ({(pred.probability * 100).toFixed(0)}%)</p><p className="text-xs text-slate-500">{pred.disclaimer}</p></div>}
      </form>
    </div>
  );
}
