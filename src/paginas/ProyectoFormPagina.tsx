import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { actualizarProyecto, crearProyecto, eliminarProyecto, obtenerCatalogo } from '../api/endpoints';
import type { Proyecto, ProyectoEntrada } from '../api/tipos';
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
import { textoOpcional } from '../formulario';
import { useCarga } from '../useCarga';

const ESTADOS: { valor: Proyecto['estado']; etiqueta: string }[] = [
  { valor: 'PLANIFICADO', etiqueta: 'Planificado' },
  { valor: 'EN_CURSO', etiqueta: 'En curso' },
  { valor: 'CERRADO', etiqueta: 'Cerrado' },
];

/** Crea un proyecto (sin `id`) o edita uno existente, y lo elimina si no tiene eventos (caso §3.1). */
export function ProyectoFormPagina({ id }: { id?: number }) {
  if (id === undefined) return <ProyectoFormulario inicial={null} />;
  return <EditarProyecto id={id} />;
}

/** Carga el catálogo para rellenar el formulario con el proyecto que se edita. */
function EditarProyecto({ id }: { id: number }) {
  const { datos, error, cargando, recargar } = useCarga(obtenerCatalogo);
  if (error && !datos) return <ErrorCaja error={error} onReintentar={() => void recargar()} />;
  if (cargando && !datos) return <Cargando texto="Cargando el proyecto…" />;
  const proyecto = datos?.proyectos.find((p) => p.id === id);
  if (!proyecto) return <ErrorCaja error={new Error('El proyecto no existe.')} />;
  return <ProyectoFormulario inicial={proyecto} />;
}

function ProyectoFormulario({ inicial }: { inicial: Proyecto | null }) {
  const [, navegar] = useLocation();
  const [titulo, setTitulo] = useState(inicial?.titulo ?? '');
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? '');
  const [areaTematica, setAreaTematica] = useState(inicial?.areaTematica ?? '');
  const [unidadVecinal, setUnidadVecinal] = useState(inicial?.unidadVecinal ?? '');
  const [fechaInicio, setFechaInicio] = useState(inicial?.fechaInicio ?? '');
  const [fechaTermino, setFechaTermino] = useState(inicial?.fechaTermino ?? '');
  const [estado, setEstado] = useState<Proyecto['estado']>(inicial?.estado ?? 'PLANIFICADO');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  function validar(): ProyectoEntrada | string {
    if (!titulo.trim()) return 'Escribe el título del proyecto.';
    if (!areaTematica.trim()) return 'Escribe el área temática.';
    if (!unidadVecinal.trim()) return 'Escribe la unidad vecinal.';
    if (!fechaInicio) return 'Elige la fecha de inicio.';
    if (fechaTermino && fechaTermino < fechaInicio) return 'La fecha de término no puede ser anterior a la de inicio.';
    return {
      titulo: titulo.trim(),
      descripcion: textoOpcional(descripcion),
      areaTematica: areaTematica.trim(),
      unidadVecinal: unidadVecinal.trim(),
      fechaInicio,
      fechaTermino: fechaTermino || null,
      estado,
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
      if (inicial) await actualizarProyecto(inicial.id, datos);
      else await crearProyecto(datos);
      navegar('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el proyecto.');
      setEnviando(false);
    }
  }

  async function eliminar() {
    if (!inicial || enviando) return;
    setError(null);
    setEnviando(true);
    try {
      await eliminarProyecto(inicial.id);
      navegar('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar el proyecto.');
      setEnviando(false);
      setConfirmando(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Link href="/" className="inline-flex min-h-11 items-center text-sm font-medium text-indigo-600 dark:text-indigo-400">
        ← Volver a los eventos
      </Link>
      <h1 className="text-2xl font-bold tracking-tight">{inicial ? 'Editar proyecto' : 'Nuevo proyecto'}</h1>

      <Tarjeta>
        <form onSubmit={guardar} noValidate className="flex flex-col gap-4">
          <Campo etiqueta="Título">
            <input className={CLASE_CAMPO} value={titulo} maxLength={150} disabled={enviando} onChange={(e) => setTitulo(e.target.value)} />
          </Campo>
          <Campo etiqueta="Descripción (opcional)">
            <textarea
              className={`${CLASE_CAMPO} py-2`}
              rows={3}
              value={descripcion}
              maxLength={1000}
              disabled={enviando}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </Campo>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Área temática" ayuda="Por ejemplo: tecnología, salud, emprendimiento.">
              <input className={CLASE_CAMPO} value={areaTematica} maxLength={80} disabled={enviando} onChange={(e) => setAreaTematica(e.target.value)} />
            </Campo>
            <Campo etiqueta="Unidad vecinal">
              <input className={CLASE_CAMPO} value={unidadVecinal} maxLength={120} disabled={enviando} onChange={(e) => setUnidadVecinal(e.target.value)} />
            </Campo>
            <Campo etiqueta="Fecha de inicio">
              <input type="date" className={CLASE_CAMPO} value={fechaInicio} disabled={enviando} onChange={(e) => setFechaInicio(e.target.value)} />
            </Campo>
            <Campo etiqueta="Fecha de término (opcional)">
              <input type="date" className={CLASE_CAMPO} value={fechaTermino} disabled={enviando} onChange={(e) => setFechaTermino(e.target.value)} />
            </Campo>
          </div>
          <Campo etiqueta="Estado">
            <select className={CLASE_CAMPO} value={estado} disabled={enviando} onChange={(e) => setEstado(e.target.value as Proyecto['estado'])}>
              {ESTADOS.map((e) => (
                <option key={e.valor} value={e.valor}>
                  {e.etiqueta}
                </option>
              ))}
            </select>
          </Campo>

          {error && (
            <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={enviando} className={CLASE_BOTON_PRIMARIO}>
              {enviando ? 'Guardando…' : 'Guardar proyecto'}
            </button>
            <Link href="/" className={`${CLASE_BOTON_SECUNDARIO} inline-flex items-center`}>
              Cancelar
            </Link>
          </div>
        </form>
      </Tarjeta>

      {inicial && (
        <Tarjeta>
          <h2 className="text-lg font-semibold">Eliminar proyecto</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Solo se puede eliminar un proyecto que no tenga eventos.
          </p>
          {confirmando ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium">¿Eliminar «{inicial.titulo}»? No se puede deshacer.</span>
              <button type="button" onClick={() => void eliminar()} disabled={enviando} className={CLASE_BOTON_PELIGRO}>
                Sí, eliminar
              </button>
              <button type="button" onClick={() => setConfirmando(false)} disabled={enviando} className={CLASE_BOTON_SECUNDARIO}>
                Cancelar
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmando(true)} disabled={enviando} className={`${CLASE_BOTON_PELIGRO} mt-3`}>
              Eliminar proyecto
            </button>
          )}
        </Tarjeta>
      )}
    </div>
  );
}
