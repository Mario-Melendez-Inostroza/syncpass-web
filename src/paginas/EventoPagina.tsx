import { useState } from 'react';
import { Link } from 'wouter';
import { obtenerAsistenciasEvento, obtenerResumen } from '../api/endpoints';
import { Barra, CLASE_BOTON_SECUNDARIO, Cargando, ErrorCaja, Tarjeta } from '../componentes';
import { REFRESCO_QUORUM_MS } from '../config';
import { asistenciasACsv, descargarCsv } from '../csv';
import { decimal, fechaHora, hora, porcentaje } from '../formato';
import { useCarga } from '../useCarga';

function Cifra({ etiqueta, valor, nota }: { etiqueta: string; valor: string; nota?: string }) {
  return (
    <div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{etiqueta}</p>
      <p className="text-3xl font-bold tabular-nums">{valor}</p>
      {nota && <p className="text-xs text-zinc-500 dark:text-zinc-400">{nota}</p>}
    </div>
  );
}

/**
 * Quórum y satisfacción de un evento, con actualización en vivo (caso §2.4 y §4.1).
 * Solo refleja lo que los teléfonos ya SINCRONIZARON: un monitor sin cobertura no aparece hasta que envíe.
 */
export function EventoPagina({ id }: { id: number }) {
  const [enVivo, setEnVivo] = useState(true);
  const [descargando, setDescargando] = useState(false);
  const [errorCsv, setErrorCsv] = useState<string | null>(null);
  const { datos: r, error, cargando, recargar, actualizadoEn } = useCarga(() => obtenerResumen(id), {
    cadaMs: enVivo ? REFRESCO_QUORUM_MS : null,
  });

  /** Reporte de asistencia (caso §2.4): se pide al servidor, se arma el CSV aquí y se descarga. */
  async function descargar(nombreEvento: string) {
    setErrorCsv(null);
    setDescargando(true);
    try {
      const filas = await obtenerAsistenciasEvento(id);
      descargarCsv(`asistencia-evento-${id}.csv`, asistenciasACsv(filas));
    } catch (e) {
      setErrorCsv(e instanceof Error ? e.message : `No se pudo generar el reporte de «${nombreEvento}».`);
    } finally {
      setDescargando(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Link href="/" className="inline-flex min-h-11 items-center text-sm font-medium text-blue-600 dark:text-blue-400">
        ← Volver a los eventos
      </Link>

      {/* Si falla una actualización pero ya hay datos, se muestran los últimos buenos y se avisa. */}
      {error && (
        <ErrorCaja
          error={r ? new Error(`No se pudo actualizar: ${error.message}`) : error}
          onReintentar={() => void recargar()}
        />
      )}
      {cargando && !r && <Cargando texto="Cargando el quórum…" />}

      {r && (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{r.nombre}</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Datos del servidor: incluyen solo lo que ya se sincronizó desde los teléfonos.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <label className="flex min-h-11 items-center gap-2">
                <input
                  type="checkbox"
                  checked={enVivo}
                  onChange={(e) => setEnVivo(e.target.checked)}
                  className="h-5 w-5 accent-blue-600"
                />
                En vivo (cada {REFRESCO_QUORUM_MS / 1000} s)
              </label>
              <button type="button" onClick={() => void recargar()} disabled={cargando} className={CLASE_BOTON_SECUNDARIO}>
                Actualizar
              </button>
              <span className="text-zinc-500 dark:text-zinc-400">Actualizado a las {hora(actualizadoEn)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => void descargar(r.nombre)} disabled={descargando} className={CLASE_BOTON_SECUNDARIO}>
              {descargando ? 'Preparando…' : 'Descargar CSV'}
            </button>
            <Link href={`/eventos/${id}/editar`} className={`${CLASE_BOTON_SECUNDARIO} inline-flex items-center`}>
              Editar evento
            </Link>
          </div>
          {errorCsv && <ErrorCaja error={new Error(errorCsv)} />}

          <Tarjeta>
            <h2 className="mb-4 text-lg font-semibold">Asistencia</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <Cifra
                etiqueta="Asistentes marcados"
                valor={String(r.totalMarcados)}
                nota={r.cuposMaximos != null ? `de ${r.cuposMaximos} cupos` : 'Sin cupo máximo definido'}
              />
              {r.cuposMaximos != null && (
                <div className="self-end">
                  <Barra
                    etiqueta="Cupos ocupados"
                    valor={r.totalMarcados}
                    maximo={r.cuposMaximos}
                    detalle={`${porcentaje(r.totalMarcados, r.cuposMaximos)} %`}
                  />
                </div>
              )}
            </div>
            {r.totalMarcados === 0 && (
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                Todavía no hay marcaciones sincronizadas para este evento.
              </p>
            )}
          </Tarjeta>

          <Tarjeta>
            <h2 className="mb-1 text-lg font-semibold">Ubicación de las marcaciones</h2>
            <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
              La ubicación es referencial: una marcación fuera del radio o sin ubicación se registra igual.
            </p>
            <div className="flex flex-col gap-4">
              <Barra etiqueta="Dentro del radio del evento" valor={r.validas} maximo={r.totalMarcados} color="bg-emerald-600" />
              <Barra etiqueta="Fuera del radio" valor={r.fueraDeRadio} maximo={r.totalMarcados} color="bg-amber-500" />
              <Barra etiqueta="Sin ubicación" valor={r.sinUbicacion} maximo={r.totalMarcados} color="bg-zinc-500" />
            </div>
          </Tarjeta>

          <Tarjeta>
            <h2 className="mb-4 text-lg font-semibold">Satisfacción</h2>
            <div className="grid gap-6 sm:grid-cols-3">
              <Cifra
                etiqueta="Encuestas recibidas"
                valor={String(r.encuestasRecibidas)}
                nota={r.totalMarcados > 0 ? `${porcentaje(r.encuestasRecibidas, r.totalMarcados)} % de los marcados` : undefined}
              />
              <Cifra etiqueta="Satisfacción promedio" valor={`${decimal(r.satisfaccionPromedio)} / 5`} />
              <Cifra etiqueta="Utilidad promedio" valor={`${decimal(r.utilidadPromedio)} / 5`} />
            </div>
            {r.encuestasRecibidas === 0 && (
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">Todavía no hay encuestas sincronizadas.</p>
            )}
          </Tarjeta>

          <Tarjeta>
            <h2 className="mb-4 text-lg font-semibold">Horario de las marcaciones</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <Cifra etiqueta="Primera marcación" valor={fechaHora(r.primeraMarcacion)} />
              <Cifra etiqueta="Última marcación" valor={fechaHora(r.ultimaMarcacion)} />
            </div>
          </Tarjeta>
        </>
      )}
    </div>
  );
}
