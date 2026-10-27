import { obtenerComentarios } from '../api/endpoints';
import type { ResumenEvento } from '../api/tipos';
import { Barra, Cargando, ErrorCaja, Tarjeta } from '../componentes';
import { REFRESCO_QUORUM_MS } from '../config';
import { fechaHora } from '../formato';
import { useCarga } from '../useCarga';

/**
 * Cumplimiento del quórum mínimo del evento (caso §3.1: el coordinador "supervisa el cumplimiento del quórum
 * mínimo en el lugar"). Si el evento no define un mínimo, lo dice y no inventa un veredicto.
 */
export function TarjetaQuorum({ resumen: r, urlEditar }: { resumen: ResumenEvento; urlEditar: string }) {
  if (r.quorumMinimo == null) {
    return (
      <Tarjeta>
        <h2 className="text-lg font-semibold">Quórum mínimo</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Este evento no define un quórum mínimo. Puedes agregarlo al <a href={`#${urlEditar}`} className="font-medium text-blue-600 dark:text-blue-400">editar el evento</a>.
        </p>
      </Tarjeta>
    );
  }

  const faltan = Math.max(0, r.quorumMinimo - r.totalMarcados);
  const cumplido = r.quorumCumplido === true;
  return (
    <Tarjeta>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Quórum mínimo</h2>
        <span
          role="status"
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            cumplido
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200'
          }`}
        >
          {cumplido ? 'Quórum cumplido' : `Faltan ${faltan} para el quórum`}
        </span>
      </div>
      <div className="mt-4">
        <Barra
          etiqueta="Avance hacia el quórum mínimo"
          valor={Math.min(r.totalMarcados, r.quorumMinimo)}
          maximo={r.quorumMinimo}
          detalle={`${r.totalMarcados} de ${r.quorumMinimo}`}
          color={cumplido ? 'bg-emerald-600' : 'bg-amber-500'}
        />
      </div>
    </Tarjeta>
  );
}

/** Comentarios de las encuestas (caso §3.2 y §2.4: "percepción cualitativa"). Sin nada que identifique a quien los escribió. */
export function TarjetaComentarios({ eventoId, enVivo }: { eventoId: number; enVivo: boolean }) {
  const { datos, error, cargando, recargar } = useCarga(() => obtenerComentarios(eventoId), {
    cadaMs: enVivo ? REFRESCO_QUORUM_MS : null,
  });

  return (
    <Tarjeta>
      <h2 className="mb-1 text-lg font-semibold">Comentarios de los asistentes</h2>
      <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
        Lo que escribieron en la encuesta, del más reciente al más antiguo. No se muestra quién los escribió.
      </p>
      {error && !datos && <ErrorCaja error={error} onReintentar={() => void recargar()} />}
      {cargando && !datos && <Cargando texto="Cargando comentarios…" />}
      {datos && datos.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Todavía no hay comentarios.</p>
      )}
      {datos && datos.length > 0 && (
        <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
          {datos.map((c, i) => (
            <li key={`${c.enviadaEn}-${i}`} className="py-3 first:pt-0 last:pb-0">
              <p className="whitespace-pre-line">{c.comentario}</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Satisfacción {c.satisfaccion}/5 · Utilidad {c.utilidad}/5 · {fechaHora(c.enviadaEn)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  );
}
