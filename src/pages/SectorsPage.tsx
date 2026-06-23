import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InlineStatus } from '../components/Status';
import { api, errorMessage, isAbortError } from '../lib/api';
import { navigateWithViewTransition } from '../lib/viewTransition';
import type { SectorLite } from '../types/api';

export function SectorsPage() {
  const [sectors, setSectors] = useState<SectorLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await api.sectors(controller.signal);
        setSectors(response.items);
      } catch (err) {
        if (!isAbortError(err)) setError(errorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  if (loading) return <InlineStatus title="Cargando sectores" message="Consultando sectores disponibles." />;
  if (error) return <InlineStatus title="No se pudieron cargar los sectores" message={error} />;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Checkpoint 5</p>
        <h2 className="mt-2 text-3xl font-black">Sectores</h2>
        <p className="mt-2 text-sm text-slate-300">Abre una historia visual basada solo en `/sectors/:id/story`.</p>
      </section>
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sectors.map((sector) => (
          <article key={sector.id} className="rounded-3xl border border-slate-800 bg-slate-900/75 p-5 transition hover:border-cyan-300/40" style={{ viewTransitionName: `sector-${sector.id}` }}>
            <p className="text-xs text-cyan-300">{sector.sectorCode} · {sector.climate}</p>
            <h3 className="mt-2 text-xl font-bold">{sector.name}</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-300">
              <p>Carga: {sector.currentLoad}/{sector.capacity}</p>
              <p>Estabilidad: {sector.stabilityLevel}%</p>
            </div>
            <button onClick={() => navigateWithViewTransition(navigate, `/sectors/${sector.id}/story`)} className="mt-5 rounded-xl bg-cyan-300 px-4 py-2 font-bold text-slate-950 hover:bg-cyan-200">
              Abrir historia
            </button>
          </article>
        ))}
      </section>
    </div>
  );
}
