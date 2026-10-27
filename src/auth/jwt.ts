import { GRUPO_ASISTENTE, GRUPO_COORDINADOR, GRUPO_MONITOR } from '../config';

export interface Usuario {
  sub: string;
  email: string;
  nombre: string;
  grupos: string[];
}

/**
 * Lee el payload de un JWT SIN verificar su firma.
 *
 * Sirve para mostrar el nombre o decidir qué pantallas ver, pero NO es seguridad: el servidor valida la firma
 * de cada petición y es quien autoriza (el quórum devuelve 403 a quien no es COORDINADOR aunque la web
 * mostrara el botón).
 */
export function decodificarPayload(jwt: string | null | undefined): Record<string, unknown> | null {
  const partes = jwt?.split('.');
  if (!partes || partes.length !== 3) return null;
  try {
    const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
    const relleno = '='.repeat((4 - (base64.length % 4)) % 4);
    const binario = atob(base64 + relleno);
    // atob entrega bytes; un nombre con tilde o eñe necesita decodificarse como UTF-8.
    const bytes = Uint8Array.from(binario, (c) => c.charCodeAt(0));
    const objeto: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return objeto !== null && typeof objeto === 'object' && !Array.isArray(objeto)
      ? (objeto as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor : '';
}

/** Usuario según el id token: el access token de Cognito no trae email ni name. */
export function usuarioDe(idToken: string | null | undefined): Usuario | null {
  const payload = decodificarPayload(idToken);
  if (!payload) return null;
  const grupos = Array.isArray(payload['cognito:groups'])
    ? payload['cognito:groups'].filter((g): g is string => typeof g === 'string')
    : [];
  return {
    sub: texto(payload.sub),
    email: texto(payload.email),
    nombre: texto(payload.name),
    grupos,
  };
}

const pertenece = (usuario: Usuario, grupo: string) =>
  usuario.grupos.some((g) => g.toUpperCase() === grupo);

export const esCoordinador = (usuario: Usuario) => pertenece(usuario, GRUPO_COORDINADOR);
export const esMonitor = (usuario: Usuario) => pertenece(usuario, GRUPO_MONITOR);
export const esAsistente = (usuario: Usuario) => pertenece(usuario, GRUPO_ASISTENTE);
