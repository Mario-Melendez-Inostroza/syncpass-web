import { useMemo } from 'react';
import { Link } from 'wouter';
import { obtenerCatalogo } from '../api/endpoints';
import type { Evento, Proyecto } from '../api/tipos';
import { Cargando, ErrorCaja, Tarjeta } from '../componentes';
import { fechaHora, hora, soloFecha } from '../formato';
import { useCarga } from '../useCarga';

const ESTADOS_PROYECTO: Record<Proyecto['estado'], string> = {
  PLANIFICADO: 'Planificado',
  EN_CURSO: 'En curso',
  CERRADO: 'Cerrado',
};

interface Grupo {
  proyecto: Proyecto;
  eventos: Evento[];
}

/** Agrupa los eventos bajo su proyecto, ordenados por fecha. Los eventos cuyo proyecto no llegó se omiten. */
function agrupar(proyectos: Proyecto[], eventos: Evento[]): Grupo[] {
  return proyectos
    .map((proyecto) => ({
      proyecto,
      eventos: eventos
        .filter((e) => e.proyectoId === proyecto.id)
        .sort((a, b) => a.fechaHoraProgramada.localeCompare(b.fechaHoraProgramada)),
    }))
    .sort((a, b) => a.proyecto.titulo.localeCompare(b.proyecto.titulo, 'es'));
}

export function EventosPagina() {
  const { datos, error, cargando, recargar, actualizadoEn } = useCarga(obtenerCatalogo);
  const grupos = useMemo(() => (datos ? agrupar(datos.proyectos, datos.eventos) : []), [datos]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Eventos</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Elige un evento para ver su quórum y la satisfacción de los asistentes.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
          {actualizadoEn && <span>Actualizado a las {hora(actualizadoEn)}</span>}
          <button
            type="button"
            onClick={() => void recargar()}
            disabled={cargando}
            className="min-h-11 rounded-xl border border-zinc-300 px-4 font-medium hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Actualizar
          </button>
        </div>
      </div>

      {error && <ErrorCaja error={error} onReintentar={() => void recargar()} />}
      {cargando && !datos && <Cargando texto="Cargando eventos…" />}

      {datos && grupos.length === 0 && (
        <Tarjeta>
          <p className="font-medium">Todavía no hay proyectos ni eventos.</p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Cuando se carguen en el servidor, aparecerán aquí.
          </p>
        </Tarjeta>
      )}

      {grupos.map(({ proyecto, eventos }) => (
        <Tarjeta key={proyecto.id}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">{proyecto.titulo}</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {proyecto.areaTematica} · {proyecto.unidadVecinal} · {soloFecha(proyecto.fechaInicio)}
                {proyecto.fechaTermino ? ` a ${soloFecha(proyecto.fechaTermino)}` : ''}
              </p>
            </div>
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200">
              {ESTADOS_PROYECTO[proyecto.estado] ?? proyecto.estado}
            </span>
          </div>

          {eventos.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">Este proyecto aún no tiene eventos.</p>
          ) : (
            <ul className="mt-4 divide-y divide-zinc-200 dark:divide-zinc-800">
              {eventos.map((evento) => (
                <li key={evento.id}>
                  <Link
                    href={`/eventos/${evento.id}`}
                    className="flex min-h-14 flex-wrap items-center justify-between gap-2 rounded-lg py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <span>
                      <span className="block font-medium">{evento.nombre}</span>
                      <span className="block text-sm text-zinc-500 dark:text-zinc-400">
                        {fechaHora(evento.fechaHoraProgramada)}
                        {evento.recinto ? ` · ${evento.recinto}` : ''}
                      </span>
                    </span>
                    <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Ver quórum →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      ))}
    </div>
  );
}
