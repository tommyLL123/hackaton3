import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge } from '../components/Badge';
import { InlineStatus } from '../components/Status';
import { api, errorMessage, isAbortError } from '../lib/api';
import { speciesOptions, tropelPageSizes, tropelSortOptions, vitalStateOptions } from '../lib/constants';
import { parseTropelUrlState, setOrDelete } from '../lib/urlState';
import type { PaginatedTropelsResponse, SectorLite } from '../types/api';

export function TropelsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useMemo(() => parseTropelUrlState(searchParams), [searchParams]);
  const [qDraft, setQDraft] = useState(state.q ?? '');
  const [sectors, setSectors] = useState<SectorLite[]>([]);
  const [data, setData] = useState<PaginatedTropelsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestSeq = useRef(0);

  useEffect(() => {
    setQDraft(state.q ?? '');
  }, [state.q]);

  useEffect(() => {
    const controller = new AbortController();
    void api.sectors(controller.signal).then((response) => setSectors(response.items)).catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const seq = requestSeq.current + 1;
    requestSeq.current = seq;
    setLoading(true);
    setError(null);

    async function load() {
      try {
        const response = await api.tropels(state, controller.signal);
        if (requestSeq.current === seq) setData(response);
      } catch (err) {
        if (!isAbortError(err) && requestSeq.current === seq) setError(errorMessage(err));
      } finally {
        if (requestSeq.current === seq) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [state.page, state.size, state.species, state.vitalState, state.sectorId, state.q, state.sort]);

  function patchParam(key: string, value: string | number | undefined, resetPage = true) {
    let next = setOrDelete(searchParams, key, value);
    if (resetPage) next = setOrDelete(next, 'page', 0);
    setSearchParams(next, { replace: false });
  }

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    patchParam('q', qDraft.trim() || undefined);
  }

  function onSelect(key: string) {
    return (event: ChangeEvent<HTMLSelectElement>) => patchParam(key, event.target.value || undefined);
  }

  const rows = data?.content ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Checkpoint 2</p>
        <h2 className="mt-2 text-3xl font-black">Atlas de Tropeles</h2>
        <p className="mt-2 text-sm text-slate-300">Paginación real del servidor, filtros combinables y estado completo en la URL.</p>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <form onSubmit={onSearch} className="grid gap-3 md:grid-cols-6">
          <input value={qDraft} onChange={(e) => setQDraft(e.target.value)} placeholder="Buscar por nombre o guardián" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 md:col-span-2" />
          <select value={state.species ?? ''} onChange={onSelect('species')} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
            <option value="">Todas las especies</option>
            {speciesOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={state.vitalState ?? ''} onChange={onSelect('vitalState')} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
            <option value="">Todos los estados</option>
            {vitalStateOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={state.sectorId ?? ''} onChange={onSelect('sectorId')} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
            <option value="">Todos los sectores</option>
            {sectors.map((sector) => <option key={sector.id} value={sector.id}>{sector.sectorCode} · {sector.name}</option>)}
          </select>
          <button className="rounded-xl bg-cyan-300 px-4 py-2 font-bold text-slate-950 hover:bg-cyan-200">Buscar</button>
        </form>
        <div className="mt-3 flex flex-wrap gap-3">
          <select value={state.sort} onChange={onSelect('sort')} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
            {tropelSortOptions.map((item) => <option key={item} value={item}>Orden: {item}</option>)}
          </select>
          <select value={state.size} onChange={(e) => patchParam('size', e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
            {tropelPageSizes.map((item) => <option key={item} value={item}>{item} por página</option>)}
          </select>
          <button onClick={() => setSearchParams({})} className="rounded-xl border border-slate-700 px-4 py-2 hover:bg-slate-800">Limpiar filtros</button>
        </div>
      </section>

      {error ? <InlineStatus title="Error al cargar tropeles" message={error} /> : null}

      <section className="min-h-[560px] overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 text-sm text-slate-300">
          <span>{loading ? 'Actualizando...' : `${data?.totalElements ?? 0} resultados`}</span>
          <span>Página {(data?.currentPage ?? state.page) + 1} de {Math.max(data?.totalPages ?? 1, 1)}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-3">Nombre</th>
                <th className="px-5 py-3">Especie</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">Sector</th>
                <th className="px-5 py-3">Energía</th>
                <th className="px-5 py-3">Caos</th>
                <th className="px-5 py-3">Actualizado</th>
              </tr>
            </thead>
            <tbody className={loading ? 'opacity-55' : ''}>
              {rows.map((tropel) => (
                <tr key={tropel.id} className="border-t border-slate-800 hover:bg-slate-800/40">
                  <td className="px-5 py-4 font-semibold">{tropel.name}<br /><span className="text-xs font-normal text-slate-400">Guardián: {tropel.guardianName}</span></td>
                  <td className="px-5 py-4"><Badge>{tropel.species}</Badge></td>
                  <td className="px-5 py-4"><Badge tone={tropel.vitalState}>{tropel.vitalState}</Badge></td>
                  <td className="px-5 py-4">{tropel.sector.sectorCode} · {tropel.sector.name}</td>
                  <td className="px-5 py-4">{tropel.energyLevel}%</td>
                  <td className="px-5 py-4">{tropel.chaosIndex}</td>
                  <td className="px-5 py-4">{new Date(tropel.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && rows.length === 0 ? <div className="p-6"><InlineStatus title="Sin resultados" message="Cambia filtros o búsqueda para encontrar Tropeles." /></div> : null}
      </section>

      <div className="flex items-center justify-between">
        <button disabled={state.page <= 0 || loading} onClick={() => patchParam('page', state.page - 1, false)} className="rounded-xl border border-slate-700 px-4 py-2 disabled:opacity-40">Anterior</button>
        <button disabled={loading || !data || state.page + 1 >= data.totalPages} onClick={() => patchParam('page', state.page + 1, false)} className="rounded-xl border border-slate-700 px-4 py-2 disabled:opacity-40">Siguiente</button>
      </div>
    </div>
  );
}
