import { vi } from 'vitest';

/** Construye un JWT con los claims dados. La firma es falsa: la web no la verifica (lo hace el servidor). */
export function jwtDePrueba(
  opciones: { sub?: string; email?: string; nombre?: string; grupos?: string[] | null } = {},
): string {
  const { sub = 'sub-1', email = 'docente.demo@example.com', nombre = 'Docente Demo', grupos = ['COORDINADOR'] } = opciones;
  const payload: Record<string, unknown> = { sub, email, name: nombre, exp: 4_102_444_800 };
  if (grupos !== null) payload['cognito:groups'] = grupos;
  // base64url sin depender de Buffer (que no existe en el navegador ni en los tipos de la app).
  const codificar = (valor: unknown) =>
    btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(valor))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  return `${codificar({ alg: 'none' })}.${codificar(payload)}.firma`;
}

/** El envoltorio {success, data, message, timestamp} con el que responde el backend. */
export const sobre = <T>(data: T, message = 'ok') => ({
  success: true,
  data,
  message,
  timestamp: '2026-10-28T15:00:00Z',
});

export function json(cuerpo: unknown, estado = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { 'Content-Type': 'application/json' },
  });
}

export interface LlamadaFetch {
  url: string;
  metodo: string;
  cabeceras: Record<string, string>;
  cuerpo: unknown;
}

/** Sustituye fetch por un doble y registra cada llamada; [manejador] decide la respuesta. */
export function simularFetch(manejador: (llamada: LlamadaFetch) => Response | Promise<Response>) {
  const llamadas: LlamadaFetch[] = [];
  const doble = vi.fn(async (entrada: RequestInfo | URL, init?: RequestInit) => {
    const llamada: LlamadaFetch = {
      url: String(entrada),
      metodo: init?.method ?? 'GET',
      cabeceras: { ...(init?.headers as Record<string, string> | undefined) },
      cuerpo: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
    };
    llamadas.push(llamada);
    return manejador(llamada);
  });
  vi.stubGlobal('fetch', doble);
  return { llamadas, doble };
}

export const catalogoDePrueba = {
  servidorEn: '2026-10-28T15:00:00Z',
  proyectos: [
    {
      id: 1,
      titulo: 'Alfabetización digital',
      descripcion: null,
      areaTematica: 'tecnologia',
      unidadVecinal: 'UV-12',
      fechaInicio: '2026-08-01',
      fechaTermino: '2026-12-15',
      estado: 'EN_CURSO',
      actualizadoEn: '2026-10-20T12:00:00Z',
    },
  ],
  eventos: [
    {
      id: 12,
      proyectoId: 1,
      nombre: 'Taller de correo electrónico',
      fechaHoraProgramada: '2026-10-28T15:00:00Z',
      cuposMaximos: 30,
      recinto: 'Sede UV-12',
      latitud: -33.5121,
      longitud: -70.6003,
      radioMetros: 200,
      actualizadoEn: '2026-10-20T12:00:00Z',
    },
    {
      id: 13,
      proyectoId: 1,
      nombre: 'Taller de seguridad en línea',
      fechaHoraProgramada: '2026-11-05T15:00:00Z',
      cuposMaximos: null,
      recinto: null,
      latitud: null,
      longitud: null,
      radioMetros: 200,
      actualizadoEn: '2026-10-20T12:00:00Z',
    },
  ],
  asistentes: [],
};

export const resumenDePrueba = {
  eventoId: 12,
  nombre: 'Taller de correo electrónico',
  cuposMaximos: 30,
  totalMarcados: 18,
  validas: 16,
  fueraDeRadio: 1,
  sinUbicacion: 1,
  encuestasRecibidas: 14,
  satisfaccionPromedio: 4.4,
  utilidadPromedio: 4.1,
  primeraMarcacion: '2026-10-28T15:01:00Z',
  ultimaMarcacion: '2026-10-28T15:42:00Z',
};
