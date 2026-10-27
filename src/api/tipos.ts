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
