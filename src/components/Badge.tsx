import type { ReactNode } from 'react';

const toneClass: Record<string, string> = {
  CRITICO: 'border-red-400/40 bg-red-500/15 text-red-100',
  GRAVE: 'border-orange-400/40 bg-orange-500/15 text-orange-100',
  MODERADO: 'border-yellow-400/40 bg-yellow-500/15 text-yellow-100',
  LEVE: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100',
  ATENDIDA: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100',
  PROCESANDO: 'border-cyan-400/40 bg-cyan-500/15 text-cyan-100',
  RECIBIDA: 'border-violet-400/40 bg-violet-500/15 text-violet-100',
  ESTABLE: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100',
  HAMBRIENTO: 'border-yellow-400/40 bg-yellow-500/15 text-yellow-100',
  AGITADO: 'border-orange-400/40 bg-orange-500/15 text-orange-100',
  MUTANDO: 'border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-100',
};

export function Badge({ children, tone }: { children: ReactNode; tone?: string }) {
  const cls = tone ? toneClass[tone] : undefined;
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cls ?? 'border-slate-600 bg-slate-800 text-slate-200'}`}>{children}</span>;
}
