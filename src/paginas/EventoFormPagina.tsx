import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { actualizarEvento, crearEvento, eliminarEvento, obtenerCatalogo } from '../api/endpoints';
import type { Catalogo, Evento, EventoEntrada } from '../api/tipos';
import {
  Campo,
  CLASE_BOTON_PELIGRO,
  CLASE_BOTON_PRIMARIO,
  CLASE_BOTON_SECUNDARIO,
  CLASE_CAMPO,
  Cargando,
  ErrorCaja,
  Tarjeta,
} from '../componentes';
import { aInputLocal, deInputLocal, numeroOpcional, textoOpcional } from '../formulario';
import { useCarga } from '../useCarga';

const RADIO_POR_DEFECTO = 200;

interface Props {
  /** Id del evento que se edita; sin él, se crea uno nuevo. */
  id?: number;
  /** Proyecto preseleccionado al crear desde la ficha de un proyecto. */
  proyectoInicial?: number;
}

/** Crea o edita un evento, y lo elimina si no tiene asistencias (caso §3.1 y §3.2). */
export function EventoFormPagina({ id, proyectoInicial }: Props) {
  const { datos, error, cargando, recargar } = useCarga(obtenerCatalogo);
  if (error && !datos) return <ErrorCaja error={error} onReintentar={() => void recargar()} />;
  if (cargando && !datos) return <Cargando texto="Cargando proyectos…" />;
  if (!datos) return null;

  const evento = id === undefined ? null : (datos.eventos.find((e) => e.id === id) ?? null);
  if (id !== undefined && !evento) return <ErrorCaja error={new Error('El evento no existe.')} />;
  if (datos.proyectos.length === 0) {
    return <ErrorCaja error={new Error('Primero crea un proyecto: todo evento pertenece a uno.')} />;
  }
  return <EventoFormulario catalogo={datos} inicial={evento} proyectoInicial={proyectoInicial} />;
}

function EventoFormulario({
  catalogo,
  inicial,
  proyectoInicial,
}: {
  catalogo: Catalogo;
  inicial: Evento | null;
  proyectoInicial?: number;
}) {
  const [, navegar] = useLocation();
  const [proyectoId, setProyectoId] = useState(String(inicial?.proyectoId ?? proyectoInicial ?? ''));
  const [nombre, setNombre] = useState(inicial?.nombre ?? '');
  const [fechaHora, setFechaHora] = useState(aInputLocal(inicial?.fechaHoraProgramada));
  const [cupos, setCupos] = useState(inicial?.cuposMaximos != null ? String(inicial.cuposMaximos) : '');
  const [quorum, setQuorum] = useState(inicial?.quorumMinimo != null ? String(inicial.quorumMinimo) : '');
  const [recinto, setRecinto] = useState(inicial?.recinto ?? '');
  const [latitud, setLatitud] = useState(inicial?.latitud != null ? String(inicial.latitud) : '');
  const [longitud, setLongitud] = useState(inicial?.longitud != null ? String(inicial.longitud) : '');
  const [radio, setRadio] = useState(String(inicial?.radioMetros ?? RADIO_POR_DEFECTO));
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  function validar(): EventoEntrada | string {
    if (!proyectoId) return 'Elige el proyecto del evento.';
    if (!nombre.trim()) return 'Escribe el nombre del evento.';
    const fechaIso = deInputLocal(fechaHora);
    if (!fechaIso) return 'Elige la fecha y la hora del evento.';

    const cuposN = numeroOpcional(cupos);
    if (cuposN !== null && (!Number.isInteger(cuposN) || cuposN < 1)) {
      return 'Los cupos deben ser un número entero mayor que 0.';
    }
    const quorumN = numeroOpcional(quorum);
    if (quorumN !== null && (!Number.isInteger(quorumN) || quorumN < 1)) {
      return 'El quórum mínimo debe ser un número entero mayor que 0.';
    }
    if (quorumN !== null && cuposN !== null && quorumN > cuposN) {
      return 'El quórum mínimo no puede superar los cupos máximos.';
    }
    const lat = numeroOpcional(latitud);
    const lon = numeroOpcional(longitud);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return 'La latitud y la longitud deben ser números.';
    if ((lat === null) !== (lon === null)) return 'Indica latitud y longitud juntas, o deja las dos vacías.';
    if (lat !== null && (lat < -90 || lat > 90)) return 'La latitud debe estar entre -90 y 90.';
    if (lon !== null && (lon < -180 || lon > 180)) return 'La longitud debe estar entre -180 y 180.';
    const radioN = numeroOpcional(radio) ?? RADIO_POR_DEFECTO;
    if (!Number.isInteger(radioN) || radioN < 1) return 'El radio debe ser un número entero de metros mayor que 0.';

    return {
      proyectoId: Number(proyectoId),
      nombre: nombre.trim(),
      fechaHoraProgramada: fechaIso,
      cuposMaximos: cuposN,
      quorumMinimo: quorumN,
      recinto: textoOpcional(recinto),
      latitud: lat,
      longitud: lon,
      radioMetros: radioN,
    };
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    if (enviando) return;
    const datos = validar();
    if (typeof datos === 'string') {
      setError(datos);
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      if (inicial) await actualizarEvento(inicial.id, datos);
      else await crearEvento(datos);
      navegar('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el evento.');
      setEnviando(false);
    }
  }

  async function eliminar() {
    if (!inicial || enviando) return;
    setError(null);
    setEnviando(true);
    try {
      await eliminarEvento(inicial.id);
      navegar('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar el evento.');
      setEnviando(false);
      setConfirmando(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Link href="/" className="inline-flex min-h-11 items-center text-sm font-medium text-blue-600 dark:text-blue-400">
        ← Volver a los eventos
      </Link>
      <h1 className="text-2xl font-bold tracking-tight">{inicial ? 'Editar evento' : 'Nuevo evento'}</h1>

      <Tarjeta>
        <form onSubmit={guardar} noValidate className="flex flex-col gap-4">
          <Campo etiqueta="Proyecto">
            <select className={CLASE_CAMPO} value={proyectoId} disabled={enviando} onChange={(e) => setProyectoId(e.target.value)}>
              <option value="">Elige un proyecto…</option>
              {catalogo.proyectos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.titulo}
                </option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Nombre del evento">
            <input className={CLASE_CAMPO} value={nombre} maxLength={150} disabled={enviando} onChange={(e) => setNombre(e.target.value)} />
          </Campo>
          <div className="grid gap-4 sm:grid-cols-3">
            <Campo etiqueta="Fecha y hora" ayuda="En tu hora local.">
              <input type="datetime-local" className={CLASE_CAMPO} value={fechaHora} disabled={enviando} onChange={(e) => setFechaHora(e.target.value)} />
            </Campo>
            <Campo etiqueta="Cupos máximos (opcional)">
              <input inputMode="numeric" className={CLASE_CAMPO} value={cupos} disabled={enviando} onChange={(e) => setCupos(e.target.value)} />
            </Campo>
            <Campo etiqueta="Quórum mínimo (opcional)" ayuda="Cuántas personas deben asistir para dar el evento por cumplido.">
              <input inputMode="numeric" className={CLASE_CAMPO} value={quorum} disabled={enviando} onChange={(e) => setQuorum(e.target.value)} />
            </Campo>
          </div>
          <Campo etiqueta="Recinto o dirección (opcional)">
            <input className={CLASE_CAMPO} value={recinto} maxLength={200} disabled={enviando} onChange={(e) => setRecinto(e.target.value)} />
          </Campo>
          <div className="grid gap-4 sm:grid-cols-3">
            <Campo etiqueta="Latitud" ayuda="Cópiala de Google Maps: clic derecho sobre el lugar.">
              <input inputMode="decimal" className={CLASE_CAMPO} value={latitud} placeholder="-33.4500" disabled={enviando} onChange={(e) => setLatitud(e.target.value)} />
            </Campo>
            <Campo etiqueta="Longitud">
              <input inputMode="decimal" className={CLASE_CAMPO} value={longitud} placeholder="-70.6600" disabled={enviando} onChange={(e) => setLongitud(e.target.value)} />
            </Campo>
            <Campo etiqueta="Radio (metros)" ayuda="Distancia máxima para marcar «dentro».">
              <input inputMode="numeric" className={CLASE_CAMPO} value={radio} disabled={enviando} onChange={(e) => setRadio(e.target.value)} />
            </Campo>
          </div>

          {error && (
            <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={enviando} className={CLASE_BOTON_PRIMARIO}>
              {enviando ? 'Guardando…' : 'Guardar evento'}
            </button>
            <Link href="/" className={`${CLASE_BOTON_SECUNDARIO} inline-flex items-center`}>
              Cancelar
            </Link>
          </div>
        </form>
      </Tarjeta>

      {inicial && (
        <Tarjeta>
          <h2 className="text-lg font-semibold">Eliminar evento</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Solo se puede eliminar un evento que todavía no tenga asistencias registradas.
          </p>
          {confirmando ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium">¿Eliminar «{inicial.nombre}»? No se puede deshacer.</span>
              <button type="button" onClick={() => void eliminar()} disabled={enviando} className={CLASE_BOTON_PELIGRO}>
                Sí, eliminar
              </button>
              <button type="button" onClick={() => setConfirmando(false)} disabled={enviando} className={CLASE_BOTON_SECUNDARIO}>
                Cancelar
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmando(true)} disabled={enviando} className={`${CLASE_BOTON_PELIGRO} mt-3`}>
              Eliminar evento
            </button>
          )}
        </Tarjeta>
      )}
    </div>
  );
}
