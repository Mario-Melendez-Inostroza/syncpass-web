/**
 * Contrato con el backend (fs2-api, rama syncpass-integrado). Los nombres de campo deben coincidir con el JSON
 * del servidor; es el mismo contrato que usa la app Android.
 */

/** Todas las respuestas correctas llegan envueltas así. */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message?: string | null;
  timestamp?: string;
}

/** Cuerpo de los errores: lo produce el GlobalExceptionHandler del backend. */
export interface ErrorBackend {
  error?: string;
  mensaje?: string;
  status?: number;
  detalles?: Record<string, string>;
}

export interface Tokens {
  accessToken?: string | null;
  idToken?: string | null;
  refreshToken?: string | null;
  expiresIn?: number | null;
}

export interface Proyecto {
  id: number;
  titulo: string;
  descripcion: string | null;
  areaTematica: string;
  unidadVecinal: string;
  fechaInicio: string;
  fechaTermino: string | null;
  estado: 'PLANIFICADO' | 'EN_CURSO' | 'CERRADO';
  actualizadoEn: string;
}

export interface Evento {
  id: number;
  proyectoId: number;
  nombre: string;
  fechaHoraProgramada: string;
  cuposMaximos: number | null;
  /** Mínimo de asistentes para dar por cumplido el quórum; null si el evento no define uno. */
  quorumMinimo: number | null;
  recinto: string | null;
  latitud: number | null;
  longitud: number | null;
  radioMetros: number;
  actualizadoEn: string;
}

/** Sin datos personales: solo código sintético y tipo (caso §3.2 y §5.1). */
export interface Asistente {
  id: number;
  codigo: string;
  tipo: 'ESTUDIANTE' | 'VECINO' | 'DOCENTE';
  estadoInscripcion: 'INSCRITO' | 'SIN_INSCRIPCION';
  actualizadoEn: string;
}

export interface Catalogo {
  servidorEn: string;
  proyectos: Proyecto[];
  eventos: Evento[];
  asistentes: Asistente[];
}

/** Quórum y satisfacción de un evento. Los promedios son null mientras no haya encuestas. */
export interface ResumenEvento {
  eventoId: number;
  nombre: string;
  cuposMaximos: number | null;
  /** Mínimo de asistentes para dar por cumplido el quórum; null si el evento no define uno. */
  quorumMinimo: number | null;
  /** true si los marcados alcanzan el mínimo; null si el evento no define mínimo. */
  quorumCumplido: boolean | null;
  totalMarcados: number;
  validas: number;
  fueraDeRadio: number;
  sinUbicacion: number;
  encuestasRecibidas: number;
  satisfaccionPromedio: number | null;
  utilidadPromedio: number | null;
  primeraMarcacion: string | null;
  ultimaMarcacion: string | null;
}

/** Lo que se envía para crear o editar un proyecto (caso §3.2). El estado es opcional: por defecto PLANIFICADO. */
export interface ProyectoEntrada {
  titulo: string;
  descripcion: string | null;
  areaTematica: string;
  unidadVecinal: string;
  fechaInicio: string;
  fechaTermino: string | null;
  estado: Proyecto['estado'];
}

/** Lo que se envía para crear o editar un evento. Latitud y longitud van juntas o ninguna. */
export interface EventoEntrada {
  proyectoId: number;
  nombre: string;
  fechaHoraProgramada: string;
  cuposMaximos: number | null;
  /** Mínimo de asistentes para dar por cumplido el quórum; null si el evento no define uno. */
  quorumMinimo: number | null;
  recinto: string | null;
  latitud: number | null;
  longitud: number | null;
  radioMetros: number;
}

/** Una fila del reporte de asistencia. Sin quién registró, coordenadas ni comentarios (caso §5.1). */
export interface AsistenciaFila {
  codigo: string;
  tipo: Asistente['tipo'];
  estadoInscripcion: Asistente['estadoInscripcion'];
  marcadoEn: string;
  estadoValidacion: 'VALIDA' | 'FUERA_DE_RADIO' | 'SIN_UBICACION';
  distanciaMetros: number | null;
  satisfaccion: number | null;
  utilidad: number | null;
}

/** Una fila de la lista de asistentes. Sin datos personales: solo código, tipo e inscripción (caso §3.2 y §5.1). */
export interface AsistenteFila {
  id: number;
  codigo: string;
  tipo: Asistente['tipo'];
  estadoInscripcion: Asistente['estadoInscripcion'];
  /** En cuántos eventos fue marcado. */
  totalAsistencias: number;
  /** true si lo dio de alta un monitor en terreno desde la app. */
  creadoEnTerreno: boolean;
}

export interface AsistenteAlta {
  tipo: Asistente['tipo'];
  estadoInscripcion: Asistente['estadoInscripcion'];
  cantidad: number;
}

export interface AsistenteEdicion {
  tipo: Asistente['tipo'];
  estadoInscripcion: Asistente['estadoInscripcion'];
}

/** Un comentario de una encuesta. Sin código del asistente: no debe poder atribuirse a una persona. */
export interface Comentario {
  satisfaccion: number;
  utilidad: number;
  comentario: string;
  enviadaEn: string;
}

export interface EventoInforme {
  eventoId: number;
  nombre: string;
  fechaHoraProgramada: string;
  cuposMaximos: number | null;
  quorumMinimo: number | null;
  quorumCumplido: boolean | null;
  totalMarcados: number;
  validas: number;
  fueraDeRadio: number;
  sinUbicacion: number;
  encuestasRecibidas: number;
  /** Encuestas sobre marcados, de 0 a 1; null si nadie marcó. */
  tasaRespuesta: number | null;
  satisfaccionPromedio: number | null;
  utilidadPromedio: number | null;
  comentarios: Comentario[];
}

export interface TotalesInforme {
  eventos: number;
  eventosConQuorumMinimo: number;
  eventosQuorumCumplido: number;
  totalMarcados: number;
  /** Personas distintas que asistieron a al menos un evento. */
  asistentesUnicos: number;
  encuestasRecibidas: number;
  tasaRespuesta: number | null;
  satisfaccionPromedio: number | null;
  utilidadPromedio: number | null;
}

export interface ProyectoInforme {
  proyecto: Proyecto;
  eventos: EventoInforme[];
  totales: TotalesInforme;
}

export interface Informe {
  generadoEn: string;
  proyectos: ProyectoInforme[];
  totales: TotalesInforme;
}
