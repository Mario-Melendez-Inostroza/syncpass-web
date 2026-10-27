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
  color = 'bg-blue-600',
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

/** Estilo de los campos de formulario: el mismo de la pantalla de inicio de sesión. */
export const CLASE_CAMPO =
  'w-full min-h-11 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100';

export const CLASE_BOTON_PRIMARIO =
  'min-h-12 rounded-xl bg-blue-600 px-4 font-semibold text-white hover:bg-blue-500 disabled:opacity-60';

export const CLASE_BOTON_SECUNDARIO =
  'min-h-11 rounded-xl border border-zinc-300 px-4 font-medium hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800';

export const CLASE_BOTON_PELIGRO =
  'min-h-11 rounded-xl border border-rose-400 px-4 font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-60 dark:border-rose-500/50 dark:text-rose-300 dark:hover:bg-rose-500/10';

/**
 * Etiqueta + control (+ ayuda opcional). La etiqueta envuelve al control, así los lectores de pantalla y los tests lo
 * asocian solos. La ayuda va FUERA de la etiqueta para que no pase a formar parte del nombre del campo.
 */
export function Campo({ etiqueta, ayuda, children }: { etiqueta: string; ayuda?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="flex flex-col gap-1 text-sm font-medium">
        {etiqueta}
        {children}
      </label>
      {ayuda && <span className="text-xs text-zinc-500 dark:text-zinc-400">{ayuda}</span>}
    </div>
  );
}
