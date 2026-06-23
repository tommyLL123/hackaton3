import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { errorMessage } from '../lib/api';

interface LocationState {
  from?: { pathname?: string };
}

export function LoginPage() {
  const { login, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from?.pathname ?? '/dashboard';
  const [teamCode, setTeamCode] = useState('');
  const [email, setEmail] = useState('operator@tuckersoft.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (token) return <Navigate to="/dashboard" replace />;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login({ teamCode: teamCode.trim(), email: email.trim(), password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,_rgba(34,211,238,.22),_transparent_35%),#020617] px-6 text-slate-100">
      <section className="w-full max-w-md rounded-3xl border border-cyan-300/25 bg-slate-900/90 p-8 shadow-glow backdrop-blur">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Pizza Protocol</p>
        <h1 className="mt-2 text-3xl font-black">Encender consola</h1>
        <p className="mt-2 text-sm text-slate-300">Ingresa con las credenciales entregadas por el TA.</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block text-sm">
            Team code
            <input value={teamCode} onChange={(e) => setTeamCode(e.target.value)} placeholder="TEAM-0XX" required className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-cyan-300" />
          </label>
          <label className="block text-sm">
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-cyan-300" />
          </label>
          <label className="block text-sm">
            Password
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-cyan-300" />
          </label>
          {error ? <p className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-100">{error}</p> : null}
          <button disabled={loading} className="w-full rounded-xl bg-cyan-300 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-60">
            {loading ? 'Ingresando...' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  );
}
