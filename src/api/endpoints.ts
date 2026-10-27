import { solicitar } from './cliente';
import type {
  AsistenciaFila,
  AsistenteAlta,
  AsistenteEdicion,
  AsistenteFila,
  Catalogo,
  Comentario,
  Evento,
  EventoEntrada,
  Informe,
  MiPerfil,
  Proyecto,
  ProyectoEntrada,
  RegistroAsistenteEntrada,
  ResumenEvento,
  Taller,
  Tokens,
} from './tipos';

/** Inicio de sesión: el backend habla con Cognito; esta web nunca contacta a Cognito directamente. */
export const iniciarSesionServidor = (email: string, password: string) =>
  solicitar<Tokens>('/api/auth/login', { metodo: 'POST', cuerpo: { email, password }, autenticado: false });

/** Crea la cuenta de un asistente (grupo ASISTENTE, fijado por el servidor). Sin sesión previa. */
export const registrarAsistente = (datos: RegistroAsistenteEntrada) =>
  solicitar<MiPerfil>('/api/auth/registro-asistente', { metodo: 'POST', cuerpo: datos, autenticado: false });

/** Cuenta del asistente: su credencial, los talleres próximos y la inscripción. Solo grupo ASISTENTE. */
export const obtenerMiPerfil = () => solicitar<MiPerfil>('/api/mi/perfil');
export const obtenerMisTalleres = () => solicitar<Taller[]>('/api/mi/talleres');
export const inscribirseEnTaller = (eventoId: number) =>
  solicitar<null>(`/api/mi/talleres/${encodeURIComponent(String(eventoId))}/inscripcion`, { metodo: 'POST' });
export const cancelarInscripcion = (eventoId: number) =>
  solicitar<null>(`/api/mi/talleres/${encodeURIComponent(String(eventoId))}/inscripcion`, { metodo: 'DELETE' });

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

/** Lista de asistentes y su gestión (caso §3.1). Solo COORDINADOR. */
export const obtenerAsistentes = () => solicitar<AsistenteFila[]>('/api/asistentes');

export const crearAsistentes = (datos: AsistenteAlta) =>
  solicitar<AsistenteFila[]>('/api/asistentes', { metodo: 'POST', cuerpo: datos });

export const actualizarAsistente = (id: number, datos: AsistenteEdicion) =>
  solicitar<AsistenteFila>(`/api/asistentes/${idEnRuta(id)}`, { metodo: 'PUT', cuerpo: datos });

/** 409 si el asistente ya fue marcado en algún evento. */
export const eliminarAsistente = (id: number) => solicitar<null>(`/api/asistentes/${idEnRuta(id)}`, { metodo: 'DELETE' });

/** Comentarios de las encuestas de un evento (caso §3.2), los más recientes primero. */
export const obtenerComentarios = (eventoId: number) =>
  solicitar<Comentario[]>(`/api/eventos/${idEnRuta(eventoId)}/comentarios`);

/** Informe de impacto consolidado (caso §2.4). Sin proyecto, el de todos. */
export const obtenerInforme = (proyectoId?: number) =>
  solicitar<Informe>(proyectoId === undefined ? '/api/informes' : `/api/informes?proyectoId=${idEnRuta(proyectoId)}`);
