import { API_BASE_URL } from '../config';
import { sesion } from '../auth/sesion';
import type { ApiResponse, ErrorBackend, Tokens } from './tipos';

/** El servidor respondió con un error. [mensaje] ya está pensado para mostrarse al usuario. */
export class ApiError extends Error {
  readonly status: number;
  readonly codigo?: string;
  readonly detalles?: Record<string, string>;

  constructor(status: number, mensaje: string, codigo?: string, detalles?: Record<string, string>) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

/** No se pudo hablar con el servidor (sin internet, servidor caído o bloqueado por CORS). */
export class SinConexionError extends Error {
  constructor() {
    super('Sin conexión con el servidor. Revisa tu internet e inténtalo de nuevo.');
    this.name = 'SinConexionError';
  }
}

/** Mensajes en lenguaje simple; el cuerpo de error del backend es {error, mensaje, status, detalles}. */
export function mensajeAmigable(status: number, e: ErrorBackend): string {
  const mensaje = e.mensaje?.trim() || undefined;
  if (status === 401) return mensaje ?? 'Credenciales inválidas o sesión vencida.';
  if (status === 403) {
    if (e.error === 'USER_NOT_CONFIRMED') {
      return 'Tu cuenta todavía no está confirmada. Pide a un administrador que la confirme.';
    }
    if (e.error === 'CHALLENGE_NOT_SUPPORTED') {
      return 'Tu cuenta tiene una contraseña temporal y debe cambiarse antes de usar la aplicación.';
    }
    // Spring Security responde 403 sin cuerpo cuando falta el grupo requerido.
    return mensaje ?? 'No tienes permiso para esta acción.';
  }
  if (status === 404) return mensaje ?? 'No se encontró lo que buscas.';
  if (status === 429) return 'Demasiados intentos seguidos. Espera un momento e inténtalo de nuevo.';
  if (status >= 500) return 'El servidor no está disponible en este momento. Inténtalo más tarde.';
  return mensaje ?? `No se pudo completar la operación (código ${status}).`;
}

type Metodo = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface Opciones {
  metodo?: Metodo;
  cuerpo?: unknown;
  /** false en login y refresh: no llevan token. */
  autenticado?: boolean;
}

async function crudo(ruta: string, metodo: Metodo, cuerpo: unknown, token?: string): Promise<Response> {
  const cabeceras: Record<string, string> = { Accept: 'application/json' };
  if (cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json';
  if (token) cabeceras.Authorization = `Bearer ${token}`;
  try {
    return await fetch(`${API_BASE_URL}${ruta}`, {
      method: metodo,
      headers: cabeceras,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new SinConexionError();
  }
}

async function leerCuerpo(res: Response): Promise<unknown> {
  const texto = await res.text();
  if (!texto) return null;
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------ renovación del token

let renovando: Promise<boolean> | null = null;

/**
 * Renueva el access token con POST /api/auth/refresh.
 *  - Si el servidor RECHAZA el refresh token (400, 401 o 403) la sesión terminó: se borra y la interfaz vuelve
 *    al login.
 *  - Si no hay red o el servidor falla (5xx) se CONSERVA la sesión: perder conexión no debe cerrarla.
 */
async function renovar(): Promise<boolean> {
  const actual = sesion.leer();
  if (!actual?.refreshToken) {
    sesion.limpiar();
    return false;
  }

  let res: Response;
  try {
    res = await crudo('/api/auth/refresh', 'POST', {
      refreshToken: actual.refreshToken,
      email: actual.email,
    });
  } catch {
    return false;
  }

  const datos = await leerCuerpo(res);
  if (!res.ok) {
    if (res.status === 400 || res.status === 401 || res.status === 403) sesion.limpiar();
    return false;
  }

  const tokens = (datos as ApiResponse<Tokens> | null)?.data;
  const acceso = tokens?.accessToken;
  if (!acceso) {
    sesion.limpiar();
    return false;
  }
  sesion.guardar({
    accessToken: acceso,
    idToken: tokens?.idToken ?? actual.idToken,
    // Cognito no rota el refresh token; el backend reenvía el que recibió.
    refreshToken: tokens?.refreshToken ?? actual.refreshToken,
    email: actual.email,
  });
  return true;
}

/** Varias peticiones con 401 a la vez comparten UNA renovación en lugar de lanzar una cada una. */
function renovarCompartida(): Promise<boolean> {
  if (!renovando) {
    renovando = renovar().finally(() => {
      renovando = null;
    });
  }
  return renovando;
}

// ------------------------------------------------------------------ petición

/**
 * Hace una petición y devuelve el contenido de `data` del envoltorio {success, data, message}.
 *
 * El original leía `res.accessToken` plano, pero el backend responde `res.data.accessToken`; resultado: el
 * login guardaba la cadena "undefined" como token. Aquí solo se desempaqueta `data`, y una respuesta sin
 * el formato esperado es un error, no un éxito.
 */
export async function solicitar<T>(ruta: string, opciones: Opciones = {}): Promise<T> {
  const { metodo = 'GET', cuerpo, autenticado = true } = opciones;
  const token = () => (autenticado ? sesion.leer()?.accessToken : undefined);

  let res = await crudo(ruta, metodo, cuerpo, token());
  if (res.status === 401 && autenticado) {
    if (!(await renovarCompartida())) {
      throw new ApiError(401, 'Tu sesión expiró. Inicia sesión nuevamente.', 'SESION_EXPIRADA');
    }
    res = await crudo(ruta, metodo, cuerpo, token());
  }

  const datos = await leerCuerpo(res);
  if (!res.ok) {
    const e = (datos ?? {}) as ErrorBackend;
    throw new ApiError(res.status, mensajeAmigable(res.status, e), e.error, e.detalles);
  }

  const sobre = datos as ApiResponse<T> | null;
  if (!sobre || sobre.success !== true) {
    throw new ApiError(res.status, sobre?.message ?? 'El servidor respondió con un formato inesperado.');
  }
  return sobre.data as T;
}
