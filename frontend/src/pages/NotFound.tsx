import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Ecg, Logo } from '../components';

export default function NotFound() {
  const loc = useLocation();
  const nav = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50/50 dark:bg-slate-900/50">
      <div className="card w-full max-w-xl text-center !p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-rose-500/10 blur-2xl pointer-events-none" />

        <div className="flex justify-center mb-4">
          <Logo size="h-16 w-16 text-3xl" />
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-3 py-1 text-xs font-bold text-red-700 dark:text-red-300 mb-4">
          <span>⚠️</span> 404 — PAGE NOT FOUND
        </div>

        <h1 className="text-3xl font-black tracking-tight mb-2">
          Route Not Found in Command Center
        </h1>

        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 max-w-md mx-auto">
          The requested path <code className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-brand-600 dark:text-brand-400 font-mono text-xs">{loc.pathname}</code> does not exist or requires different authorization.
        </p>

        <div className="my-6 py-2 border-y border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center gap-3">
          <Ecg className="h-4 w-32 text-brand-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Zero 404 Routing Active</span>
          <Ecg className="h-4 w-32 text-brand-600" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 text-xs font-semibold">
          <Link to="/" className="rounded-xl border border-teal-200 dark:border-teal-800/60 bg-teal-50/60 dark:bg-teal-950/30 p-2.5 text-teal-800 dark:text-teal-200 hover:bg-teal-100/70 transition">
            🏠 Command Center
          </Link>
          <Link to="/queue" className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/40 p-2.5 text-slate-700 dark:text-slate-300 hover:border-brand-400 transition">
            🚨 Live Queue
          </Link>
          <Link to="/emergency" className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/40 p-2.5 text-slate-700 dark:text-slate-300 hover:border-brand-400 transition">
            🚑 Emergency
          </Link>
          <Link to="/analytics" className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/40 p-2.5 text-slate-700 dark:text-slate-300 hover:border-brand-400 transition">
            📊 Analytics
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button onClick={() => nav(-1)} type="button" className="btn-ghost w-full sm:w-auto">
            ← Return to Previous Page
          </button>
          <Link to="/" className="btn-primary w-full sm:w-auto">
            Back to Dashboard
          </Link>
          <Link to="/login" className="btn-ghost w-full sm:w-auto">
            Switch Role / Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
