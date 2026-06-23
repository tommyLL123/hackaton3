import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Badge } from '../components/Badge';
import { InlineStatus } from '../components/Status';
import { api, errorMessage, isAbortError } from '../lib/api';
import { patchableStatusOptions } from '../lib/constants';
import { updateSignalInFeedSnapshots } from '../lib/feedMemory';
import type { Signal, SignalStatus } from '../types/api';

interface LocationState {
  fromFeed?: boolean;
}

export function SignalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [signal, setSignal] = useState<Signal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<SignalStatus | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return undefined;
    const signalId = id;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        setSignal(await api.signal(signalId, controller.signal));
      } catch (err) {
        if (!isAbortError(err)) setError(errorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [id]);

  async function changeStatus(status: SignalStatus) {
    if (!id) return;
    setActionLoading(status);
    setActionError(null);
    setSuccess(null);
    try {
      const updated = await api.updateSignalStatus(id, status);
      setSignal(updated);
      updateSignalInFeedSnapshots(updated);
      setSuccess(`Estado actualizado a ${updated.status}.`);
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setActionLoading(null);
    }
  }

  function goBack() {
    const fromFeed = (location.state as LocationState | null)?.fromFeed;
    if (fromFeed) navigate(-1);
    else navigate('/signals');
  }

  if (loading) return <InlineStatus title="Cargando señal" message="Leyendo detalle real desde el backend." />;
  if (error) return <InlineStatus title="No se pudo abrir la señal" message={error} action={<button onClick={goBack} className="rounded-xl bg-cyan-300 px-4 py-2 font-bold text-slate-950">Volver al feed</button>} />;
  if (!signal) return <InlineStatus title="Sin datos" message="No se encontró la señal solicitada." />;

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <button onClick={goBack} className="rounded-xl border border-slate-700 px-4 py-2 hover:bg-slate-800">← Volver sin perder posición</button>
      <section className="rounded-3xl border border-slate-800 bg-slate-900/75 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Checkpoint 4</p>
        <h2 className="mt-2 text-3xl font-black">Detalle de señal</h2>
        <p className="mt-2 text-sm text-slate-400">ID: {signal.id}</p>
        <p className="mt-6 text-xl font-semibold">{signal.rawContent}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge>{signal.signalType}</Badge>
          <Badge tone={signal.severity}>{signal.severity}</Badge>
          <Badge tone={signal.status}>{signal.status}</Badge>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/75 p-5">
          <h3 className="font-bold">Tropel asociado</h3>
          <p className="mt-2 text-slate-300">{signal.tropel.name}</p>
          <p className="text-sm text-slate-400">{signal.tropel.species} · {signal.tropel.id}</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/75 p-5">
          <h3 className="font-bold">Tiempos</h3>
          <p className="mt-2 text-sm text-slate-300">Creada: {new Date(signal.createdAt).toLocaleString()}</p>
          <p className="text-sm text-slate-300">Actualizada: {new Date(signal.updatedAt).toLocaleString()}</p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/75 p-6">
        <h3 className="text-xl font-bold">Atender señal</h3>
        <p className="mt-2 text-sm text-slate-300">Solo se permite cambiar a PROCESANDO o ATENDIDA. Si falla, se mantiene el estado anterior.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {patchableStatusOptions.map((status) => (
            <button
              key={status}
              disabled={actionLoading !== null || signal.status === status}
              onClick={() => void changeStatus(status)}
              className="rounded-xl bg-cyan-300 px-4 py-2 font-bold text-slate-950 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {actionLoading === status ? 'Actualizando...' : `Marcar ${status}`}
            </button>
          ))}
        </div>
        {success ? <p className="mt-4 rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">{success}</p> : null}
        {actionError ? (
          <div className="mt-4 rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-100">
            <p>{actionError}</p>
            <button onClick={() => setActionError(null)} className="mt-2 underline">Cerrar y reintentar</button>
          </div>
        ) : null}
      </section>
    </article>
  );
}
