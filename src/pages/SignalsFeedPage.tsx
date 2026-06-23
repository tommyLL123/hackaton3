import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Badge } from '../components/Badge';
import { InlineStatus } from '../components/Status';
import { api, errorMessage, isAbortError } from '../lib/api';
import { severityOptions, signalStatusOptions, signalTypeOptions } from '../lib/constants';
import { getFeedSnapshot, makeFeedKey, saveFeedSnapshot } from '../lib/feedMemory';
import { parseSignalFeedUrlState, setOrDelete } from '../lib/urlState';
import type { Signal } from '../types/api';

export function SignalsFeedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseSignalFeedUrlState(searchParams), [searchParams]);
  const feedKey = useMemo(
    () => makeFeedKey({ signalType: filters.signalType, severity: filters.severity, status: filters.status, q: filters.q }),
    [filters.signalType, filters.severity, filters.status, filters.q],
  );
  const [qDraft, setQDraft] = useState(filters.q ?? '');
  const [items, setItems] = useState<Signal[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalEstimate, setTotalEstimate] = useState<number | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const loadingRef = useRef(false);
  const generationRef = useRef(0);
  const itemsRef = useRef<Signal[]>([]);
  const cursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(true);
  const totalRef = useRef<number | null>(null);

  useEffect(() => {
    setQDraft(filters.q ?? '');
  }, [filters.q]);

  const persist = useCallback((scrollY = window.scrollY) => {
    saveFeedSnapshot({
      key: feedKey,
      items: itemsRef.current,
      nextCursor: cursorRef.current,
      hasMore: hasMoreRef.current,
      totalEstimate: totalRef.current,
      scrollY,
      savedAt: Date.now(),
    });
  }, [feedKey]);

  useEffect(() => {
    const onScroll = () => persist(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      onScroll();
      window.removeEventListener('scroll', onScroll);
    };
  }, [persist]);

  const mergeItems = useCallback((current: Signal[], incoming: Signal[]) => {
    const seen = new Set(current.map((item) => item.id));
    const merged = [...current];
    for (const item of incoming) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        merged.push(item);
      }
    }
    return merged;
  }, []);

  const loadPage = useCallback(async (reset: boolean) => {
    if (loadingRef.current) return;
    if (!reset && !hasMoreRef.current) return;

    loadingRef.current = true;
    setLoadingMore(!reset);
    setInitialLoading(reset);
    setError(null);
    const localGeneration = generationRef.current;
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const response = await api.signalFeed({ ...filters, limit: 15, cursor: reset ? null : cursorRef.current }, controller.signal);
      if (generationRef.current !== localGeneration) return;
      const nextItems = reset ? mergeItems([], response.items) : mergeItems(itemsRef.current, response.items);
      itemsRef.current = nextItems;
      cursorRef.current = response.nextCursor;
      hasMoreRef.current = response.hasMore;
      totalRef.current = response.totalEstimate;
      setItems(nextItems);
      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);
      setTotalEstimate(response.totalEstimate);
      saveFeedSnapshot({ key: feedKey, items: nextItems, nextCursor: response.nextCursor, hasMore: response.hasMore, totalEstimate: response.totalEstimate, scrollY: window.scrollY, savedAt: Date.now() });
    } catch (err) {
      if (!isAbortError(err) && generationRef.current === localGeneration) setError(errorMessage(err));
    } finally {
      if (generationRef.current === localGeneration) {
        loadingRef.current = false;
        setInitialLoading(false);
        setLoadingMore(false);
      }
    }
  }, [feedKey, filters, mergeItems]);

  useEffect(() => {
    generationRef.current += 1;
    controllerRef.current?.abort();
    loadingRef.current = false;
    const snapshot = getFeedSnapshot(feedKey);
    if (snapshot) {
      itemsRef.current = snapshot.items;
      cursorRef.current = snapshot.nextCursor;
      hasMoreRef.current = snapshot.hasMore;
      totalRef.current = snapshot.totalEstimate;
      setItems(snapshot.items);
      setNextCursor(snapshot.nextCursor);
      setHasMore(snapshot.hasMore);
      setTotalEstimate(snapshot.totalEstimate);
      setInitialLoading(false);
      setError(null);
      requestAnimationFrame(() => window.scrollTo({ top: snapshot.scrollY }));
    } else {
      itemsRef.current = [];
      cursorRef.current = null;
      hasMoreRef.current = true;
      totalRef.current = null;
      setItems([]);
      setNextCursor(null);
      setHasMore(true);
      setTotalEstimate(null);
      setInitialLoading(true);
      void loadPage(true);
    }
    return () => controllerRef.current?.abort();
  }, [feedKey, loadPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadPage(false);
      },
      { rootMargin: '800px 0px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadPage]);

  function patchParam(key: string, value: string | undefined) {
    setSearchParams(setOrDelete(searchParams, key, value), { replace: false });
  }

  function onSelect(key: string) {
    return (event: ChangeEvent<HTMLSelectElement>) => patchParam(key, event.target.value || undefined);
  }

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    patchParam('q', qDraft.trim() || undefined);
  }

  function saveBeforeOpen() {
    persist(window.scrollY);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Checkpoint 3</p>
        <h2 className="mt-2 text-3xl font-black">Feed infinito de Señales</h2>
        <p className="mt-2 text-sm text-slate-300">Cursor real, deduplicación por ID, una carga en vuelo y filtros persistidos en la URL.</p>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <form onSubmit={onSearch} className="grid gap-3 md:grid-cols-5">
          <input value={qDraft} onChange={(e) => setQDraft(e.target.value)} placeholder="Buscar señales" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 md:col-span-2" />
          <select value={filters.signalType ?? ''} onChange={onSelect('signalType')} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
            <option value="">Todos los tipos</option>
            {signalTypeOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={filters.severity ?? ''} onChange={onSelect('severity')} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
            <option value="">Todas las severidades</option>
            {severityOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <button className="rounded-xl bg-cyan-300 px-4 py-2 font-bold text-slate-950 hover:bg-cyan-200">Aplicar</button>
        </form>
        <div className="mt-3 flex flex-wrap gap-3">
          <select value={filters.status ?? ''} onChange={onSelect('status')} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
            <option value="">Todos los estados</option>
            {signalStatusOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <button onClick={() => setSearchParams({})} className="rounded-xl border border-slate-700 px-4 py-2 hover:bg-slate-800">Limpiar filtros</button>
          <span className="py-2 text-sm text-slate-400">Estimado: {totalEstimate ?? '...'}</span>
        </div>
      </section>

      <section className="min-h-[680px] space-y-3">
        {items.map((signal) => (
          <Link
            key={signal.id}
            to={`/signals/${signal.id}`}
            state={{ fromFeed: true }}
            onClick={saveBeforeOpen}
            className="block rounded-3xl border border-slate-800 bg-slate-900/75 p-5 transition hover:border-cyan-300/40 hover:bg-slate-900"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400">{new Date(signal.createdAt).toLocaleString()} · {signal.id}</p>
                <h3 className="mt-1 text-lg font-bold">{signal.rawContent}</h3>
                <p className="mt-2 text-sm text-slate-300">Tropel: {signal.tropel.name} · {signal.tropel.species}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>{signal.signalType}</Badge>
                <Badge tone={signal.severity}>{signal.severity}</Badge>
                <Badge tone={signal.status}>{signal.status}</Badge>
              </div>
            </div>
          </Link>
        ))}

        {initialLoading ? <InlineStatus title="Cargando primeras señales" message="Leyendo la primera página por cursor." /> : null}
        {error ? <InlineStatus title="Error de carga" message={error} action={<button onClick={() => void loadPage(items.length === 0)} className="rounded-xl bg-cyan-300 px-4 py-2 font-bold text-slate-950">Reintentar sin borrar páginas</button>} /> : null}
        {!initialLoading && items.length === 0 && !error ? <InlineStatus title="Sin señales" message="No hay resultados para estos filtros." /> : null}
        {loadingMore ? <InlineStatus title="Cargando más" message="Una sola página adicional está en vuelo." /> : null}
        {!hasMore && items.length > 0 ? <p className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-center text-sm text-slate-400">Fin de lista. No hay más señales.</p> : null}
        <div ref={sentinelRef} className="h-10" data-next-cursor={nextCursor ?? ''} />
      </section>
    </div>
  );
}
