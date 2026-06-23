import { CSSProperties, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge } from '../components/Badge';
import { InlineStatus } from '../components/Status';
import { api, errorMessage, isAbortError } from '../lib/api';
import type { SectorStoryResponse, SectorStoryStage } from '../types/api';

const tokenColors: Record<string, string> = {
  emerald: '#34d399',
  cyan: '#22d3ee',
  sky: '#38bdf8',
  violet: '#a78bfa',
  fuchsia: '#e879f9',
  rose: '#fb7185',
  amber: '#fbbf24',
  orange: '#fb923c',
};

function colorFor(token: string): string {
  return tokenColors[token] ?? '#22d3ee';
}

function metricText(value: string | number | boolean | null): string {
  if (value === null) return '—';
  if (typeof value === 'boolean') return value ? 'sí' : 'no';
  return String(value);
}

export function SectorStoryPage() {
  const { id } = useParams();
  const [story, setStory] = useState<SectorStoryResponse | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const stageRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    if (!id) return undefined;
    const sectorId = id;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await api.sectorStory(sectorId, controller.signal);
        const ordered = [...response.stages].sort((a, b) => a.order - b.order);
        setStory({ ...response, stages: ordered });
      } catch (err) {
        if (!isAbortError(err)) setError(errorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    const elements = stageRefs.current.filter((stage): stage is HTMLElement => stage !== null);
    if (elements.length === 0) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveIndex(Number((visible.target as HTMLElement).dataset.index ?? 0));
      },
      { threshold: [0.35, 0.55, 0.75], rootMargin: '-20% 0px -30% 0px' },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [story]);

  const stages = story?.stages ?? [];
  const activeStage = stages[activeIndex] ?? stages[0];
  const fallbackProgress = stages.length <= 1 ? 100 : (activeIndex / (stages.length - 1)) * 100;
  const stageProgress = activeStage ? Math.max(activeStage.progress * 100, fallbackProgress) : fallbackProgress;

  const visualStyle = useMemo<CSSProperties>(() => {
    const color = activeStage ? colorFor(activeStage.colorToken) : '#22d3ee';
    return {
      '--story-color': color,
      '--story-progress': `${stageProgress}%`,
    } as CSSProperties;
  }, [activeStage, stageProgress]);

  function focusStage(index: number) {
    const next = stageRefs.current[index];
    next?.focus();
    next?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function onStageKeyDown(event: KeyboardEvent<HTMLElement>, index: number) {
    if (event.key === 'ArrowDown' || event.key === 'PageDown') {
      event.preventDefault();
      focusStage(Math.min(index + 1, stages.length - 1));
    }
    if (event.key === 'ArrowUp' || event.key === 'PageUp') {
      event.preventDefault();
      focusStage(Math.max(index - 1, 0));
    }
    if (event.key === 'Home') {
      event.preventDefault();
      focusStage(0);
    }
    if (event.key === 'End') {
      event.preventDefault();
      focusStage(stages.length - 1);
    }
  }

  if (loading) return <InlineStatus title="Cargando historia" message="Leyendo etapas desde el endpoint del sector." />;
  if (error) return <InlineStatus title="No se pudo cargar la historia" message={error} action={<Link to="/sectors" className="rounded-xl bg-cyan-300 px-4 py-2 font-bold text-slate-950">Volver a sectores</Link>} />;
  if (!story || !activeStage) return <InlineStatus title="Historia vacía" message="El backend no devolvió etapas para este sector." />;

  return (
    <div className="story-page" style={visualStyle}>
      <div className="story-progress" aria-hidden="true">
        <div className="story-progress__fill" />
      </div>
      <Link to="/sectors" className="mb-5 inline-flex rounded-xl border border-slate-700 px-4 py-2 hover:bg-slate-800">← Volver a sectores</Link>
      <section className="story-layout">
        <aside className="story-visual" aria-label="Visual persistente de etapa activa">
          <div className="story-orb" data-asset={activeStage.assetKey}>
            <span>{activeStage.order + 1}</span>
          </div>
          <p className="mt-5 text-xs uppercase tracking-[0.3em] text-cyan-200">{story.sector.climate}</p>
          <h2 className="mt-2 text-3xl font-black">{story.sector.name}</h2>
          <p className="mt-3 text-sm text-slate-300">Evento dominante activo</p>
          <div className="mt-2"><Badge>{activeStage.dominantEvent}</Badge></div>
          <div className="mt-6 grid gap-3">
            {Object.entries(activeStage.metrics).map(([key, value]) => (
              <div key={key} className="rounded-2xl border border-slate-800 bg-slate-950/75 p-4">
                <p className="text-xs uppercase text-slate-500">{key}</p>
                <strong className="text-2xl">{metricText(value)}</strong>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm text-slate-400">Progreso: {Math.round(stageProgress)}%</p>
        </aside>

        <main className="story-stages" aria-label="Narrativa por etapas">
          {stages.map((stage: SectorStoryStage, index) => (
            <section
              key={stage.id}
              ref={(element) => { stageRefs.current[index] = element; }}
              data-index={index}
              tabIndex={0}
              onFocus={() => setActiveIndex(index)}
              onKeyDown={(event) => onStageKeyDown(event, index)}
              className={`story-stage ${activeIndex === index ? 'story-stage--active' : ''}`}
            >
              <p className="text-sm font-bold text-cyan-300">Etapa {stage.order + 1} / {stages.length}</p>
              <h3 className="mt-3 text-4xl font-black">{stage.title}</h3>
              <p className="mt-5 text-lg leading-8 text-slate-300">{stage.narrative}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Badge>{stage.assetKey}</Badge>
                <Badge>{stage.colorToken}</Badge>
                <Badge>{stage.dominantEvent}</Badge>
              </div>
            </section>
          ))}
        </main>
      </section>
    </div>
  );
}
