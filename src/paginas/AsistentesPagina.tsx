import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'wouter';
import { actualizarAsistente, crearAsistentes, eliminarAsistente, obtenerAsistentes } from '../api/endpoints';
import type { AsistenteFila } from '../api/tipos';
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
import { numeroOpcional } from '../formulario';
import { hora } from '../formato';
import { useCarga } from '../useCarga';

type Tipo = AsistenteFila['tipo'];
type Inscripcion = AsistenteFila['estadoInscripcion'];

const TIPOS: { valor: Tipo; etiqueta: string }[] = [
  { valor: 'ESTUDIANTE', etiqueta: 'Estudiante' },
  { valor: 'VECINO', etiqueta: 'Vecino' },
  { valor: 'DOCENTE', etiqueta: 'Docente' },
];

const INSCRIPCIONES: { valor: Inscripcion; etiqueta: string }[] = [
  { valor: 'INSCRITO', etiqueta: 'Inscrito' },
  { valor: 'SIN_INSCRIPCION', etiqueta: 'Sin inscripción' },
];

const etiquetaTipo = (t: Tipo) => TIPOS.find((x) => x.valor === t)?.etiqueta ?? t;
const etiquetaInscripcion = (i: Inscripcion) => INSCRIPCIONES.find((x) => x.valor === i)?.etiqueta ?? i;

const MAX_POR_LOTE = 200;
const CELDA = 'px-3 py-3 text-left align-middle';

/**
 * Lista de asistentes y su gestión por el Docente / Coordinador(a) (caso §3.1: "consulta listas previas de inscritos").
 * Un asistente es solo un código sintético, un tipo y su inscripción: no hay nombre, correo ni documento (caso §5.1).
 */
export function AsistentesPagina() {
  const { datos, error, cargando, recargar, actualizadoEn } = useCarga(obtenerAsistentes);

  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'' | Tipo>('');
  const [filtroInscripcion, setFiltroInscripcion] = useState<'' | Inscripcion>('');

  const [nuevoTipo, setNuevoTipo] = useState<Tipo>('VECINO');
  const [nuevaInscripcion, setNuevaInscripcion] = useState<Inscripcion>('INSCRITO');
  const [cantidad, setCantidad] = useState('1');
  const [creando, setCreando] = useState(false);

  const [editando, setEditando] = useState<number | null>(null);
  const [edicionTipo, setEdicionTipo] = useState<Tipo>('VECINO');
  const [edicionInscripcion, setEdicionInscripcion] = useState<Inscripcion>('INSCRITO');
  const [eliminando, setEliminando] = useState<number | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  const [mensaje, setMensaje] = useState<string | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return (datos ?? []).filter(
      (a) =>
        (!texto || a.codigo.toLowerCase().includes(texto)) &&
        (!filtroTipo || a.tipo === filtroTipo) &&
        (!filtroInscripcion || a.estadoInscripcion === filtroInscripcion),
    );
  }, [datos, busqueda, filtroTipo, filtroInscripcion]);

  const cifras = useMemo(() => {
    const lista = datos ?? [];
    return [
      { etiqueta: 'Asistentes', valor: lista.length },
      { etiqueta: 'Inscritos', valor: lista.filter((a) => a.estadoInscripcion === 'INSCRITO').length },
      { etiqueta: 'Sin inscripción', valor: lista.filter((a) => a.estadoInscripcion === 'SIN_INSCRIPCION').length },
      { etiqueta: 'Creados en terreno', valor: lista.filter((a) => a.creadoEnTerreno).length },
    ];
  }, [datos]);

  async function agregar(evento: FormEvent) {
    evento.preventDefault();
    if (creando) return;
    const n = numeroOpcional(cantidad) ?? 1;
    if (!Number.isInteger(n) || n < 1 || n > MAX_POR_LOTE) {
      setErrorAccion(`La cantidad debe ser un número entero entre 1 y ${MAX_POR_LOTE}.`);
      return;
    }
    setErrorAccion(null);
    setMensaje(null);
    setCreando(true);
    try {
      const creados = await crearAsistentes({ tipo: nuevoTipo, estadoInscripcion: nuevaInscripcion, cantidad: n });
      setMensaje(
        creados.length === 1
          ? `Se creó ${creados[0].codigo}.`
          : `Se crearon ${creados.length} asistentes (${creados[0].codigo} a ${creados[creados.length - 1].codigo}).`,
      );
      await recargar();
    } catch (e) {
      setErrorAccion(e instanceof Error ? e.message : 'No se pudo crear a los asistentes.');
    } finally {
      setCreando(false);
    }
  }

  function empezarEdicion(a: AsistenteFila) {
    setEliminando(null);
    setErrorAccion(null);
    setMensaje(null);
    setEditando(a.id);
    setEdicionTipo(a.tipo);
    setEdicionInscripcion(a.estadoInscripcion);
  }

  async function guardarEdicion(a: AsistenteFila) {
    setTrabajando(true);
    setErrorAccion(null);
    try {
      await actualizarAsistente(a.id, { tipo: edicionTipo, estadoInscripcion: edicionInscripcion });
      setEditando(null);
      setMensaje(`Se actualizó ${a.codigo}.`);
      await recargar();
    } catch (e) {
      setErrorAccion(e instanceof Error ? e.message : 'No se pudo guardar el cambio.');
    } finally {
      setTrabajando(false);
    }
  }

  async function confirmarEliminar(a: AsistenteFila) {
    setTrabajando(true);
    setErrorAccion(null);
    try {
      await eliminarAsistente(a.id);
      setEliminando(null);
      setMensaje(`Se eliminó ${a.codigo}.`);
      await recargar();
    } catch (e) {
      setErrorAccion(e instanceof Error ? e.message : 'No se pudo eliminar al asistente.');
      setEliminando(null);
    } finally {
      setTrabajando(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Asistentes</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Las personas que participan en los eventos: solo un código, su tipo y si están inscritas. Sin datos personales.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
          {actualizadoEn && <span>Actualizado a las {hora(actualizadoEn)}</span>}
          <Link href="/asistentes/credenciales" className={`${CLASE_BOTON_SECUNDARIO} inline-flex items-center text-zinc-900 dark:text-zinc-100`}>
            Imprimir credenciales QR
          </Link>
          <button type="button" onClick={() => void recargar()} disabled={cargando} className={CLASE_BOTON_SECUNDARIO}>
            Actualizar
          </button>
        </div>
      </div>

      {error && <ErrorCaja error={error} onReintentar={() => void recargar()} />}
      {cargando && !datos && <Cargando texto="Cargando asistentes…" />}

      {datos && (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {cifras.map(({ etiqueta, valor }) => (
            <div key={etiqueta} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <dd className="text-2xl font-bold leading-none tabular-nums">{valor}</dd>
              <dt className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{etiqueta}</dt>
            </div>
          ))}
        </dl>
      )}

      <Tarjeta>
        <h2 className="mb-1 text-lg font-semibold">Agregar inscritos</h2>
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          El sistema asigna el código de cada uno. Después puedes imprimir sus credenciales QR para que el monitor las escanee.
        </p>
        <form onSubmit={agregar} noValidate className="grid gap-4 sm:grid-cols-[1fr_1fr_8rem_auto] sm:items-end">
          <Campo etiqueta="Tipo">
            <select className={CLASE_CAMPO} value={nuevoTipo} disabled={creando} onChange={(e) => setNuevoTipo(e.target.value as Tipo)}>
              {TIPOS.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.etiqueta}
                </option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Inscripción">
            <select
              className={CLASE_CAMPO}
              value={nuevaInscripcion}
              disabled={creando}
              onChange={(e) => setNuevaInscripcion(e.target.value as Inscripcion)}
            >
              {INSCRIPCIONES.map((i) => (
                <option key={i.valor} value={i.valor}>
                  {i.etiqueta}
                </option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Cantidad">
            <input inputMode="numeric" className={CLASE_CAMPO} value={cantidad} disabled={creando} onChange={(e) => setCantidad(e.target.value)} />
          </Campo>
          <button type="submit" disabled={creando} className={CLASE_BOTON_PRIMARIO}>
            {creando ? 'Agregando…' : 'Agregar'}
          </button>
        </form>
        {mensaje && (
          <p role="status" className="mt-4 text-sm font-medium text-emerald-700 dark:text-emerald-300">
            {mensaje}
          </p>
        )}
        {errorAccion && (
          <p role="alert" className="mt-4 text-sm text-rose-600 dark:text-rose-400">
            {errorAccion}
          </p>
        )}
      </Tarjeta>

      {datos && (
        <Tarjeta className="!p-0">
          <div className="grid gap-3 border-b border-zinc-200 p-4 sm:grid-cols-[1fr_12rem_12rem] dark:border-zinc-800">
            <Campo etiqueta="Buscar por código">
              <input className={CLASE_CAMPO} value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="INS-000012" />
            </Campo>
            <Campo etiqueta="Filtrar por tipo">
              <select className={CLASE_CAMPO} value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value as '' | Tipo)}>
                <option value="">Todos los tipos</option>
                {TIPOS.map((t) => (
                  <option key={t.valor} value={t.valor}>
                    {t.etiqueta}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo etiqueta="Filtrar por inscripción">
              <select
                className={CLASE_CAMPO}
                value={filtroInscripcion}
                onChange={(e) => setFiltroInscripcion(e.target.value as '' | Inscripcion)}
              >
                <option value="">Todas</option>
                {INSCRIPCIONES.map((i) => (
                  <option key={i.valor} value={i.valor}>
                    {i.etiqueta}
                  </option>
                ))}
              </select>
            </Campo>
          </div>

          {datos.length === 0 ? (
            <p className="p-6 text-sm text-zinc-500 dark:text-zinc-400">
              Todavía no hay asistentes. Agrega inscritos arriba, o los monitores los dan de alta desde la app.
            </p>
          ) : visibles.length === 0 ? (
            <p className="p-6 text-sm text-zinc-500 dark:text-zinc-400">Ningún asistente coincide con los filtros.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Lista de asistentes</caption>
                <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
                  <tr>
                    <th scope="col" className={CELDA}>Código</th>
                    <th scope="col" className={CELDA}>Tipo</th>
                    <th scope="col" className={CELDA}>Inscripción</th>
                    <th scope="col" className={CELDA}>Eventos</th>
                    <th scope="col" className={CELDA}>Origen</th>
                    <th scope="col" className={`${CELDA} text-right`}>Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {visibles.map((a) => (
                    <tr key={a.id}>
                      <th scope="row" className={`${CELDA} font-mono font-medium`}>{a.codigo}</th>
                      {editando === a.id ? (
                        <>
                          <td className={CELDA}>
                            <select
                              aria-label={`Tipo de ${a.codigo}`}
                              className={CLASE_CAMPO}
                              value={edicionTipo}
                              onChange={(e) => setEdicionTipo(e.target.value as Tipo)}
                            >
                              {TIPOS.map((t) => (
                                <option key={t.valor} value={t.valor}>{t.etiqueta}</option>
                              ))}
                            </select>
                          </td>
                          <td className={CELDA}>
                            <select
                              aria-label={`Inscripción de ${a.codigo}`}
                              className={CLASE_CAMPO}
                              value={edicionInscripcion}
                              onChange={(e) => setEdicionInscripcion(e.target.value as Inscripcion)}
                            >
                              {INSCRIPCIONES.map((i) => (
                                <option key={i.valor} value={i.valor}>{i.etiqueta}</option>
                              ))}
                            </select>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className={CELDA}>{etiquetaTipo(a.tipo)}</td>
                          <td className={CELDA}>{etiquetaInscripcion(a.estadoInscripcion)}</td>
                        </>
                      )}
                      <td className={`${CELDA} tabular-nums`}>{a.totalAsistencias}</td>
                      <td className={CELDA}>{a.creadoEnTerreno ? 'En terreno' : 'Lista'}</td>
                      <td className={`${CELDA} text-right`}>
                        {editando === a.id ? (
                          <span className="inline-flex gap-2">
                            <button type="button" disabled={trabajando} onClick={() => void guardarEdicion(a)} className={CLASE_BOTON_PRIMARIO}>
                              Guardar
                            </button>
                            <button type="button" disabled={trabajando} onClick={() => setEditando(null)} className={CLASE_BOTON_SECUNDARIO}>
                              Cancelar
                            </button>
                          </span>
                        ) : eliminando === a.id ? (
                          <span className="inline-flex flex-wrap items-center justify-end gap-2">
                            <span className="text-xs font-medium">¿Eliminar {a.codigo}?</span>
                            <button type="button" disabled={trabajando} onClick={() => void confirmarEliminar(a)} className={CLASE_BOTON_PELIGRO}>
                              Sí, eliminar
                            </button>
                            <button type="button" disabled={trabajando} onClick={() => setEliminando(null)} className={CLASE_BOTON_SECUNDARIO}>
                              No
                            </button>
                          </span>
                        ) : (
                          <span className="inline-flex gap-2">
                            <button type="button" aria-label={`Editar ${a.codigo}`} onClick={() => empezarEdicion(a)} className={CLASE_BOTON_SECUNDARIO}>
                              Editar
                            </button>
                            <button
                              type="button"
                              aria-label={`Eliminar ${a.codigo}`}
                              onClick={() => {
                                setEditando(null);
                                setErrorAccion(null);
                                setMensaje(null);
                                setEliminando(a.id);
                              }}
                              className={CLASE_BOTON_PELIGRO}
                            >
                              Eliminar
                            </button>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Tarjeta>
      )}
    </div>
  );
}
