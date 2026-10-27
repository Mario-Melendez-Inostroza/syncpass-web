import { CalendarDays, Clock, FolderOpen, Users } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'wouter';
import { obtenerCatalogo } from '../api/endpoints';
import type { Evento, Proyecto } from '../api/tipos';
import { CLASE_BOTON_SECUNDARIO, Cargando, ErrorCaja, Tarjeta } from '../componentes';
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

/** Día y mes del evento en un recuadro, para leer el calendario de un vistazo. */
function FechaInsignia({ iso }: { iso: string }) {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return null;
  const mes = fecha.toLocaleDateString('es-CL', { month: 'short' }).replace('.', '').toUpperCase();
  return (
    <span aria-hidden className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-50 leading-none text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
      <span className="text-lg font-bold">{fecha.getDate()}</span>
      <span className="-mt-2 text-[10px] font-semibold tracking-wide">{mes}</span>
    </span>
  );
}

export function EventosPagina() {
  const { datos, error, cargando, recargar, actualizadoEn } = useCarga(obtenerCatalogo);
  const grupos = useMemo(() => (datos ? agrupar(datos.proyectos, datos.eventos) : []), [datos]);
  // Cifras reales del catálogo que descargó el panel (no inventadas): se recalculan al actualizar.
  const cifras = useMemo(() => {
    if (!datos) return [];
    // La hora del servidor que trae el catálogo: no depende del reloj del navegador y mantiene puro el render.
    const ahora = datos.servidorEn;
    return [
      { etiqueta: 'Proyectos', valor: datos.proyectos.length, icono: FolderOpen, color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
      { etiqueta: 'Eventos', valor: datos.eventos.length, icono: CalendarDays, color: 'bg-violet-500/15 text-violet-600 dark:text-violet-400' },
      {
        etiqueta: 'Próximos eventos',
        valor: datos.eventos.filter((e) => e.fechaHoraProgramada >= ahora).length,
        icono: Clock,
        color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
      },
      { etiqueta: 'Personas en el catálogo', valor: datos.asistentes.length, icono: Users, color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
    ];
  }, [datos]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Eventos</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Elige un evento para ver su quórum y la satisfacción de los asistentes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
          {actualizadoEn && <span>Actualizado a las {hora(actualizadoEn)}</span>}
          <Link href="/proyectos/nuevo" className={`${CLASE_BOTON_SECUNDARIO} inline-flex items-center text-zinc-900 dark:text-zinc-100`}>
            Nuevo proyecto
          </Link>
          <button
            type="button"
            onClick={() => void recargar()}
            disabled={cargando}
            className={CLASE_BOTON_SECUNDARIO}
          >
            Actualizar
          </button>
        </div>
      </div>

      {error && <ErrorCaja error={error} onReintentar={() => void recargar()} />}
      {cargando && !datos && <Cargando texto="Cargando eventos…" />}

      {datos && (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {cifras.map(({ etiqueta, valor, icono: Icono, color }) => (
            <div
              key={etiqueta}
              className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${color}`}>
                <Icono className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <dd className="text-2xl font-bold leading-none tabular-nums">{valor}</dd>
                <dt className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{etiqueta}</dt>
              </div>
            </div>
          ))}
        </dl>
      )}

      {datos && grupos.length === 0 && (
        <Tarjeta>
          <p className="font-medium">Todavía no hay proyectos ni eventos.</p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Crea el primero con «Nuevo proyecto»; después podrás agregarle eventos.
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
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-500/20 dark:text-blue-200">
              {ESTADOS_PROYECTO[proyecto.estado] ?? proyecto.estado}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-4 text-sm font-medium">
            <Link href={`/proyectos/${proyecto.id}/editar`} className="inline-flex min-h-11 items-center text-blue-600 dark:text-blue-400">
              Editar proyecto
            </Link>
            <Link href={`/proyectos/${proyecto.id}/eventos/nuevo`} className="inline-flex min-h-11 items-center text-blue-600 dark:text-blue-400">
              Nuevo evento
            </Link>
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
                    <span className="flex items-center gap-4">
                      <FechaInsignia iso={evento.fechaHoraProgramada} />
                      <span>
                      <span className="block font-medium">{evento.nombre}</span>
                      <span className="block text-sm text-zinc-500 dark:text-zinc-400">
                        {fechaHora(evento.fechaHoraProgramada)}
                        {evento.recinto ? ` · ${evento.recinto}` : ''}
                      </span>
                      </span>
                    </span>
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Ver quórum →</span>
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
