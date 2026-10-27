import type { ReactNode } from 'react';

/** Una tarjeta con el estilo común del panel (claro y oscuro según el sistema). */
export function Tarjeta({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${className}`}
    >
      {children}
    </section>
  );
}

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <p role="status" className="animate-pulse py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
      {texto}
    </p>
  );
}

/** Error con mensaje claro y la opción de reintentar. role="alert" para que un lector de pantalla lo anuncie. */
export function ErrorCaja({ error, onReintentar }: { error: Error; onReintentar?: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-rose-300 bg-rose-50 p-5 text-sm text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200"
    >
      <p className="font-medium">{error.message}</p>
      {onReintentar && (
        <button
          type="button"
          onClick={onReintentar}
          className="mt-3 min-h-11 rounded-xl border border-rose-400 px-4 font-medium hover:bg-rose-100 dark:hover:bg-rose-500/20"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

/** Barra de progreso accesible: el valor también se expone como texto para quien no la ve. */
export function Barra({
  etiqueta,
  valor,
  maximo,
  detalle,
  color = 'bg-indigo-600',
}: {
  etiqueta: string;
  valor: number;
  maximo: number;
  detalle?: string;
  color?: string;
}) {
  const porcentaje = maximo > 0 ? Math.min(100, Math.round((valor / maximo) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span>{etiqueta}</span>
        <span className="font-semibold tabular-nums">{detalle ?? `${valor} de ${maximo}`}</span>
      </div>
      <div
        role="progressbar"
        aria-label={etiqueta}
        aria-valuemin={0}
        aria-valuemax={maximo}
        aria-valuenow={valor}
        className="h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
      >
        <div className={`h-full rounded-full ${color}`} style={{ width: `${porcentaje}%` }} />
      </div>
    </div>
  );
}
