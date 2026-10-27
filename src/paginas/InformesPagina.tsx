import { useMemo, useState } from 'react';
import { obtenerInforme } from '../api/endpoints';
import type { EventoInforme, ProyectoInforme, TotalesInforme } from '../api/tipos';
import { Campo, CLASE_BOTON_PRIMARIO, CLASE_BOTON_SECUNDARIO, CLASE_CAMPO, Cargando, ErrorCaja } from '../componentes';
import { descargarCsv, informeACsv } from '../csv';
import { decimal, fechaHora, soloFecha } from '../formato';
import { useCarga } from '../useCarga';

const CELDA = 'px-3 py-2 text-left align-top';

/** Tasa de 0 a 1 como porcentaje con un decimal ("77,8 %"); "—" si no hay base para calcularla. */
function tasa(valor: number | null): string {
  return valor === null ? '—' : `${(valor * 100).toLocaleString('es-CL', { maximumFractionDigits: 1 })} %`;
}

function Quorum({ e }: { e: EventoInforme }) {
  if (e.quorumMinimo === null) return <span className="text-zinc-500">Sin mínimo</span>;
  const faltan = Math.max(0, e.quorumMinimo - e.totalMarcados);
  return e.quorumCumplido ? (
    <span className="font-semibold text-emerald-700 dark:text-emerald-300 print:text-black">Cumplido ({e.quorumMinimo})</span>
  ) : (
    <span className="font-semibold text-amber-700 dark:text-amber-300 print:text-black">
      Faltan {faltan} (mín. {e.quorumMinimo})
    </span>
  );
}

function Cifras({ totales }: { totales: TotalesInforme }) {
  const cifras = [
    { etiqueta: 'Eventos', valor: String(totales.eventos) },
    { etiqueta: 'Asistentes únicos', valor: String(totales.asistentesUnicos) },
    { etiqueta: 'Marcaciones', valor: String(totales.totalMarcados) },
    { etiqueta: 'Encuestas', valor: `${totales.encuestasRecibidas} (${tasa(totales.tasaRespuesta)})` },
    { etiqueta: 'Satisfacción promedio', valor: totales.satisfaccionPromedio === null ? '—' : `${decimal(totales.satisfaccionPromedio)} / 5` },
    { etiqueta: 'Utilidad promedio', valor: totales.utilidadPromedio === null ? '—' : `${decimal(totales.utilidadPromedio)} / 5` },
    {
      etiqueta: 'Quórum mínimo cumplido',
      valor: totales.eventosConQuorumMinimo === 0 ? '—' : `${totales.eventosQuorumCumplido} de ${totales.eventosConQuorumMinimo}`,
    },
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cifras.map(({ etiqueta, valor }) => (
        <div key={etiqueta} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 print:rounded-none print:border-black print:shadow-none">
          <dd className="text-xl font-bold leading-tight tabular-nums">{valor}</dd>
          <dt className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 print:text-black">{etiqueta}</dt>
        </div>
      ))}
    </dl>
  );
}

function SeccionProyecto({ p }: { p: ProyectoInforme }) {
  const conComentarios = p.eventos.filter((e) => e.comentarios.length > 0);
  return (
    <section aria-labelledby={`proyecto-${p.proyecto.id}`} className="flex break-inside-avoid-page flex-col gap-3">
      <div>
        <h2 id={`proyecto-${p.proyecto.id}`} className="text-lg font-semibold">
          {p.proyecto.titulo}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 print:text-black">
          {[p.proyecto.areaTematica, p.proyecto.unidadVecinal].filter(Boolean).join(' · ') || 'Sin área ni unidad vecinal'} ·{' '}
          {soloFecha(p.proyecto.fechaInicio)} a {soloFecha(p.proyecto.fechaTermino)}
        </p>
      </div>

      {p.eventos.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Este proyecto todavía no tiene eventos.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 print:rounded-none print:border-black">
          <table className="w-full text-sm">
            <caption className="sr-only">Eventos de {p.proyecto.titulo}</caption>
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400 print:bg-white print:text-black">
              <tr>
                <th scope="col" className={CELDA}>Evento</th>
                <th scope="col" className={CELDA}>Marcados</th>
                <th scope="col" className={CELDA}>Quórum</th>
                <th scope="col" className={CELDA}>Ubicación (dentro / fuera / sin)</th>
                <th scope="col" className={CELDA}>Encuestas</th>
                <th scope="col" className={CELDA}>Satisfacción</th>
                <th scope="col" className={CELDA}>Utilidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 print:divide-black">
              {p.eventos.map((e) => (
                <tr key={e.eventoId}>
                  <th scope="row" className={`${CELDA} font-medium`}>
                    {e.nombre}
                    <span className="block text-xs font-normal text-zinc-500 dark:text-zinc-400 print:text-black">{fechaHora(e.fechaHoraProgramada)}</span>
                  </th>
                  <td className={`${CELDA} tabular-nums`}>
                    {e.totalMarcados}
                    {e.cuposMaximos !== null && <span className="text-zinc-500 print:text-black"> / {e.cuposMaximos}</span>}
                  </td>
                  <td className={CELDA}><Quorum e={e} /></td>
                  <td className={`${CELDA} tabular-nums`}>{e.validas} / {e.fueraDeRadio} / {e.sinUbicacion}</td>
                  <td className={`${CELDA} tabular-nums`}>{e.encuestasRecibidas} ({tasa(e.tasaRespuesta)})</td>
                  <td className={`${CELDA} tabular-nums`}>{decimal(e.satisfaccionPromedio)}</td>
                  <td className={`${CELDA} tabular-nums`}>{decimal(e.utilidadPromedio)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-sm text-zinc-600 dark:text-zinc-300 print:text-black">
        Total del proyecto: {p.totales.asistentesUnicos} asistentes únicos, {p.totales.totalMarcados} marcaciones, satisfacción{' '}
        {decimal(p.totales.satisfaccionPromedio)} y utilidad {decimal(p.totales.utilidadPromedio)}.
      </p>

      {conComentarios.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Comentarios de los asistentes</h3>
          {conComentarios.map((e) => (
            <div key={e.eventoId}>
              <p className="text-sm font-medium">{e.nombre}</p>
              <ul className="mt-1 flex list-disc flex-col gap-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300 print:text-black">
                {e.comentarios.map((c, i) => (
                  <li key={`${c.enviadaEn}-${i}`} className="whitespace-pre-line">
                    {c.comentario}{' '}
                    <span className="text-xs text-zinc-500 print:text-black">(satisfacción {c.satisfaccion}/5, utilidad {c.utilidad}/5)</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * Informe de impacto consolidado, por proyecto o general (caso §2.2 punto 4 y §2.4). Se puede imprimir o guardar como
 * PDF desde el navegador y descargar en CSV. Refleja solo lo que los teléfonos ya sincronizaron.
 */
export function InformesPagina() {
  const { datos, error, cargando, recargar } = useCarga(() => obtenerInforme());
  const [proyectoId, setProyectoId] = useState('');
  const [errorCsv, setErrorCsv] = useState<string | null>(null);

  const seleccion = useMemo(() => {
    if (!datos) return null;
    const elegido = datos.proyectos.find((p) => String(p.proyecto.id) === proyectoId);
    return elegido
      ? { proyectos: [elegido], totales: elegido.totales, titulo: elegido.proyecto.titulo }
      : { proyectos: datos.proyectos, totales: datos.totales, titulo: 'Todos los proyectos' };
  }, [datos, proyectoId]);

  function descargar() {
    if (!datos || !seleccion) return;
    setErrorCsv(null);
    try {
      descargarCsv(
        proyectoId ? `informe-proyecto-${proyectoId}.csv` : 'informe-general.csv',
        informeACsv({ ...datos, proyectos: seleccion.proyectos, totales: seleccion.totales }),
      );
    } catch (e) {
      setErrorCsv(e instanceof Error ? e.message : 'No se pudo generar el archivo.');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Informes de impacto</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Resultados consolidados de los eventos: asistencia, quórum, satisfacción y comentarios.
          </p>
        </div>
        <button type="button" onClick={() => void recargar()} disabled={cargando} className={CLASE_BOTON_SECUNDARIO}>
          Actualizar
        </button>
      </div>

      {error && <ErrorCaja error={error} onReintentar={() => void recargar()} />}
      {cargando && !datos && <Cargando texto="Preparando el informe…" />}

      {datos && seleccion && (
        <>
          <div className="flex flex-wrap items-end gap-3 print:hidden">
            <div className="w-full sm:w-80">
              <Campo etiqueta="Proyecto">
                <select className={CLASE_CAMPO} value={proyectoId} onChange={(e) => setProyectoId(e.target.value)}>
                  <option value="">Todos los proyectos</option>
                  {datos.proyectos.map((p) => (
                    <option key={p.proyecto.id} value={p.proyecto.id}>
                      {p.proyecto.titulo}
                    </option>
                  ))}
                </select>
              </Campo>
            </div>
            <button type="button" onClick={() => window.print()} className={CLASE_BOTON_PRIMARIO}>
              Imprimir / guardar PDF
            </button>
            <button type="button" onClick={descargar} className={CLASE_BOTON_SECUNDARIO}>
              Descargar CSV
            </button>
          </div>
          {errorCsv && <ErrorCaja error={new Error(errorCsv)} />}

          <header className="flex flex-col gap-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300 print:text-black">
              SyncPass · Informe de impacto
            </p>
            <h2 className="text-2xl font-bold">{seleccion.titulo}</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 print:text-black">
              Generado el {fechaHora(datos.generadoEn)}. Incluye solo lo que ya se sincronizó desde los teléfonos. Sin datos personales.
            </p>
          </header>

          <Cifras totales={seleccion.totales} />

          {seleccion.proyectos.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Todavía no hay proyectos para informar.</p>
          ) : (
            seleccion.proyectos.map((p) => <SeccionProyecto key={p.proyecto.id} p={p} />)
          )}
        </>
      )}
    </div>
  );
}
