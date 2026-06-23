import type { ReactNode } from 'react';

export function FullPageStatus({ title, message }: { title: string; message: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-6 text-slate-100">
      <section className="w-full max-w-md rounded-3xl border border-cyan-400/20 bg-slate-900/80 p-8 text-center shadow-glow">
        <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full bg-cyan-300/40" />
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-slate-300">{message}</p>
      </section>
    </main>
  );
}

export function InlineStatus({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/75 p-6 text-slate-100">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-slate-300">{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
