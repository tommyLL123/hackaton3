import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errorMessage, isAbortError } from '../lib/api';
import type { DashboardSummary } from '../types/api';
import { Badge } from '../components/Badge';
import { InlineStatus } from '../components/Status';

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        setSummary(await api.dashboard(controller.signal));
      } catch (err) {
        if (!isAbortError(err)) setError(errorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  if (loading) return <InlineStatus title="Cargando dashboard" message="Consultando indicadores reales del workspace." />;
  if (error) return <InlineStatus title="No se pudo cargar" message={error} action={<button onClick={() => window.location.reload()} className="rounded-xl bg-cyan-300 px-4 py-2 font-bold text-slate-950">Reintentar</button>} />;
  if (!summary) return <InlineStatus title="Sin datos" message="El backend no devolvió indicadores." />;

  const cards = [
    ['Tropeles', summary.totalTropels],
    ['Críticos', summary.criticalTropels],
    ['Señales abiertas', summary.openSignals],
    ['Estabilidad promedio', `${summary.sectorStabilityAvg}%`],
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Checkpoint 1</p>
        <h2 className="mt-2 text-3xl font-black">Dashboard operativo</h2>
        <p className="mt-2 text-sm text-slate-300">Datos generados: {new Date(summary.generatedAt).toLocaleString()}</p>
      </section>
      <section className="grid gap-4 md:grid-cols-4">
        {cards.map(([label, value]) => (
          <article key={label} className="rounded-3xl border border-slate-800 bg-slate-900/75 p-5">
            <p className="text-sm text-slate-400">{label}</p>
            <strong className="mt-2 block text-3xl text-white">{value}</strong>
          </article>
        ))}
      </section>
      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <article className="rounded-3xl border border-slate-800 bg-slate-900/75 p-6">
          <h3 className="text-xl font-bold">Señales por severidad</h3>
          <div className="mt-5 space-y-3">
            {Object.entries(summary.signalsBySeverity).map(([severity, count]) => (
              <div key={severity} className="flex items-center justify-between rounded-2xl bg-slate-950/70 p-4">
                <Badge tone={severity}>{severity}</Badge>
                <span className="text-2xl font-bold">{count}</span>
              </div>
            ))}
          </div>
        </article>
        <aside className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6">
          <h3 className="text-xl font-bold">Rutas críticas</h3>
          <div className="mt-4 grid gap-3">
            <Link className="rounded-2xl bg-slate-950 px-4 py-3 hover:bg-slate-900" to="/tropels">Abrir Atlas de Tropeles</Link>
            <Link className="rounded-2xl bg-slate-950 px-4 py-3 hover:bg-slate-900" to="/signals">Abrir Feed de Señales</Link>
            <Link className="rounded-2xl bg-slate-950 px-4 py-3 hover:bg-slate-900" to="/sectors">Ver historias de sectores</Link>
          </div>
        </aside>
      </section>
    </div>
  );
}
