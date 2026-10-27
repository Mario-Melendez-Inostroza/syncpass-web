/**
 * Dónde vive la sesión en el navegador.
 *
 * Se usa sessionStorage y no localStorage: se borra al cerrar la pestaña, así que unos tokens olvidados no
 * quedan en el navegador para siempre. Ningún almacenamiento del navegador es inmune a XSS; esto reduce cuánto
 * tiempo hay algo que robar. El costo es que cada pestaña nueva pide iniciar sesión otra vez, razonable para un
 * panel de supervisión.
 */
export interface Sesion {
  accessToken: string;
  idToken: string;
  refreshToken: string | null;
  /** Se guarda porque el refresh lo pide cuando el App Client de Cognito tiene client secret. */
  email: string;
}

const CLAVE = 'syncpass.sesion';

type Oyente = () => void;
const oyentes = new Set<Oyente>();

function notificar(): void {
  oyentes.forEach((oyente) => oyente());
}

export const sesion = {
  leer(): Sesion | null {
    try {
      const texto = sessionStorage.getItem(CLAVE);
      if (!texto) return null;
      const datos = JSON.parse(texto) as Partial<Sesion>;
      if (typeof datos.accessToken !== 'string' || typeof datos.idToken !== 'string') return null;
      return {
        accessToken: datos.accessToken,
        idToken: datos.idToken,
        refreshToken: typeof datos.refreshToken === 'string' ? datos.refreshToken : null,
        email: typeof datos.email === 'string' ? datos.email : '',
      };
    } catch {
      return null;
    }
  },

  guardar(valor: Sesion): void {
    try {
      sessionStorage.setItem(CLAVE, JSON.stringify(valor));
    } catch {
      // Sin almacenamiento (modo privado estricto): la sesión dura solo mientras la pestaña no se recargue.
    }
    notificar();
  },

  limpiar(): void {
    try {
      sessionStorage.removeItem(CLAVE);
    } catch {
      // nada que borrar
    }
    notificar();
  },

  /** Avisa cuando la sesión cambia (cierre de sesión, o el servidor rechazó la renovación). */
  suscribir(oyente: Oyente): () => void {
    oyentes.add(oyente);
    return () => {
      oyentes.delete(oyente);
    };
  },
};
