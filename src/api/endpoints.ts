import { solicitar } from './cliente';
import type { Catalogo, ResumenEvento, Tokens } from './tipos';

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
