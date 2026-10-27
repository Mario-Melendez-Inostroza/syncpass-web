import { solicitar } from './cliente';
import type {
  AsistenciaFila,
  Catalogo,
  Evento,
  EventoEntrada,
  Proyecto,
  ProyectoEntrada,
  ResumenEvento,
  Tokens,
} from './tipos';

/** Inicio de sesión: el backend habla con Cognito; esta web nunca contacta a Cognito directamente. */
export const iniciarSesionServidor = (email: string, password: string) =>
  solicitar<Tokens>('/api/auth/login', { metodo: 'POST', cuerpo: { email, password }, autenticado: false });

/** Revoca el refresh token en el servidor. */
export const cerrarSesionServidor = () => solicitar<null>('/api/auth/logout', { metodo: 'POST' });

/** Proyectos, eventos y asistentes. Sin `desde` descarga todo el catálogo. */
export const obtenerCatalogo = () => solicitar<Catalogo>('/api/sync/catalogo');

/** Quórum y satisfacción de un evento. Solo COORDINADOR; cualquier otro rol recibe 403 del servidor. */
export const obtenerResumen = (eventoId: number) =>
  solicitar<ResumenEvento>(`/api/eventos/${encodeURIComponent(String(eventoId))}/resumen`);

const idEnRuta = (id: number) => encodeURIComponent(String(id));

/** Gestión de proyectos (caso §3.1). Solo COORDINADOR; el servidor responde 403 a cualquier otro rol. */
export const crearProyecto = (datos: ProyectoEntrada) =>
  solicitar<Proyecto>('/api/proyectos', { metodo: 'POST', cuerpo: datos });

export const actualizarProyecto = (id: number, datos: ProyectoEntrada) =>
  solicitar<Proyecto>(`/api/proyectos/${idEnRuta(id)}`, { metodo: 'PUT', cuerpo: datos });

/** 409 si el proyecto todavía tiene eventos. */
export const eliminarProyecto = (id: number) =>
  solicitar<null>(`/api/proyectos/${idEnRuta(id)}`, { metodo: 'DELETE' });

/** Gestión de eventos (caso §3.1). */
export const crearEvento = (datos: EventoEntrada) => solicitar<Evento>('/api/eventos', { metodo: 'POST', cuerpo: datos });

export const actualizarEvento = (id: number, datos: EventoEntrada) =>
  solicitar<Evento>(`/api/eventos/${idEnRuta(id)}`, { metodo: 'PUT', cuerpo: datos });

/** 409 si el evento ya tiene asistencias: no se pierde evidencia de terreno. */
export const eliminarEvento = (id: number) => solicitar<null>(`/api/eventos/${idEnRuta(id)}`, { metodo: 'DELETE' });

/** Una fila por asistencia, para el reporte CSV (caso §2.4). */
export const obtenerAsistenciasEvento = (eventoId: number) =>
  solicitar<AsistenciaFila[]>(`/api/eventos/${idEnRuta(eventoId)}/asistencias`);
