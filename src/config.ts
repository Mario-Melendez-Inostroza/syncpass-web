/**
 * Dirección del backend: solo el host (el de API Gateway cuando esté desplegado).
 *
 * Si alguien deja el sufijo "/api" (como hacía el .env original, que lo llevaba dentro de la variable), se
 * quita: la ruta /api es parte del contrato con el backend, no de la configuración del entorno, y dejarla en
 * el .env obligaba a que ambos coincidieran o todas las llamadas daban 404.
 */
export function normalizarBaseUrl(valor: string | undefined): string {
  const base = (valor ?? '').trim() || 'http://localhost:8080';
  return base.replace(/\/+$/, '').replace(/\/api$/, '');
}

export const API_BASE_URL = normalizarBaseUrl(import.meta.env.VITE_API_URL);

/** Cada cuánto se actualiza el quórum cuando el monitoreo en vivo está activado (caso §2.4). */
export const REFRESCO_QUORUM_MS = 15_000;

/** Grupo de Cognito que puede usar este panel: Docente / Coordinador(a) de Proyecto (caso §3.1). */
export const GRUPO_COORDINADOR = 'COORDINADOR';
export const GRUPO_MONITOR = 'MONITOR';
