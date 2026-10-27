import { beforeEach, describe, expect, it } from 'vitest';
import { ApiError, SinConexionError, solicitar } from '../api/cliente';
import { obtenerCatalogo, obtenerResumen } from '../api/endpoints';
import { sesion } from '../auth/sesion';
import { API_BASE_URL } from '../config';
import { catalogoDePrueba, json, jwtDePrueba, resumenDePrueba, simularFetch, sobre } from './ayudas';

const sesionDePrueba = () => ({
  accessToken: 'acceso-caducado',
  idToken: jwtDePrueba(),
  refreshToken: 'refresh-1',
  email: 'docente.demo@example.com',
});

beforeEach(() => {
  sesion.guardar(sesionDePrueba());
});

describe('solicitar: contrato', () => {
  it('desempaqueta data y envía el Bearer de la sesión', async () => {
    const { llamadas } = simularFetch(() => json(sobre(catalogoDePrueba)));

    const catalogo = await obtenerCatalogo();

    expect(catalogo.proyectos[0].titulo).toBe('Alfabetización digital');
    expect(llamadas[0].url).toBe(`${API_BASE_URL}/api/sync/catalogo`);
    expect(llamadas[0].cabeceras.Authorization).toBe('Bearer acceso-caducado');
  });

  it('pide el quórum del evento por su id', async () => {
    const { llamadas } = simularFetch(() => json(sobre(resumenDePrueba)));

    const resumen = await obtenerResumen(12);

    expect(llamadas[0].url).toBe(`${API_BASE_URL}/api/eventos/12/resumen`);
    expect(resumen.totalMarcados).toBe(18);
  });

  it('el login NO manda Authorization aunque haya una sesión guardada', async () => {
    const { llamadas } = simularFetch(() => json(sobre({ accessToken: 'a' })));

    await solicitar('/api/auth/login', { metodo: 'POST', cuerpo: { email: 'x@example.com', password: 'p' }, autenticado: false });

    expect(llamadas[0].cabeceras.Authorization).toBeUndefined();
    expect(llamadas[0].cuerpo).toEqual({ email: 'x@example.com', password: 'p' });
  });

  it('una respuesta con success=false es un error, no un éxito', async () => {
    simularFetch(() => json({ success: false, data: null, message: 'No se pudo' }));

    await expect(obtenerCatalogo()).rejects.toMatchObject({ name: 'ApiError', message: 'No se pudo' });
  });

  it('una respuesta que no es JSON válido es un error claro', async () => {
    simularFetch(() => new Response('<html>502 Bad Gateway</html>', { status: 200 }));

    await expect(obtenerCatalogo()).rejects.toThrow('formato inesperado');
  });

  it('sin red lanza SinConexionError', async () => {
    simularFetch(() => {
      throw new TypeError('Failed to fetch');
    });

    await expect(obtenerCatalogo()).rejects.toBeInstanceOf(SinConexionError);
  });
});

describe('solicitar: errores del backend', () => {
  const fallo = async (estado: number, cuerpo?: unknown) => {
    simularFetch(() => (cuerpo === undefined ? new Response(null, { status: estado }) : json(cuerpo, estado)));
    return obtenerResumen(12).then(
      () => {
        throw new Error('se esperaba un error del servidor');
      },
      (e: unknown) => e as ApiError,
    );
  };

  it('403 sin cuerpo (Spring Security) dice que falta permiso', async () => {
    const e = await fallo(403);
    expect(e).toBeInstanceOf(ApiError);
    expect(e.status).toBe(403);
    expect(e.message).toBe('No tienes permiso para esta acción.');
  });

  it('403 por cuenta sin confirmar explica qué hacer', async () => {
    const e = await fallo(403, { error: 'USER_NOT_CONFIRMED', mensaje: 'x', status: 403 });
    expect(e.message).toContain('no está confirmada');
    expect(e.codigo).toBe('USER_NOT_CONFIRMED');
  });

  it('403 por contraseña temporal explica que debe cambiarse', async () => {
    const e = await fallo(403, { error: 'CHALLENGE_NOT_SUPPORTED', mensaje: 'x', status: 403 });
    expect(e.message).toContain('contraseña temporal');
  });

  it('404 usa el mensaje del backend', async () => {
    const e = await fallo(404, { error: 'NOT_FOUND', mensaje: 'El evento no existe', status: 404 });
    expect(e.status).toBe(404);
    expect(e.message).toBe('El evento no existe');
  });

  it('429 y 5xx tienen mensajes propios, sin filtrar el detalle del servidor', async () => {
    expect((await fallo(429)).message).toContain('Demasiados intentos');
    const e500 = await fallo(500, { error: 'INTERNAL_ERROR', mensaje: 'Error interno del servidor', status: 500 });
    expect(e500.message).toContain('no está disponible');
  });

  it('un 400 de validación conserva los detalles por campo', async () => {
    const e = await fallo(400, {
      error: 'VALIDATION_ERROR',
      mensaje: 'Datos de entrada inválidos',
      status: 400,
      detalles: { registros: 'no debe estar vacío' },
    });
    expect(e.detalles).toEqual({ registros: 'no debe estar vacío' });
  });
});

describe('solicitar: renovación del token', () => {
  const tokensNuevos = {
    accessToken: 'acceso-nuevo',
    idToken: jwtDePrueba({ nombre: 'Docente Renovado' }),
    refreshToken: 'refresh-1',
    expiresIn: 3600,
  };

  it('un 401 renueva el token y repite la petición con el nuevo', async () => {
    let intentos = 0;
    const { llamadas } = simularFetch((l) => {
      if (l.url.endsWith('/api/auth/refresh')) return json(sobre(tokensNuevos));
      return ++intentos === 1 ? new Response(null, { status: 401 }) : json(sobre(catalogoDePrueba));
    });

    const catalogo = await obtenerCatalogo();

    expect(catalogo.eventos).toHaveLength(2);
    expect(llamadas.map((l) => l.url.replace(API_BASE_URL, ''))).toEqual([
      '/api/sync/catalogo',
      '/api/auth/refresh',
      '/api/sync/catalogo',
    ]);
    expect(llamadas[0].cabeceras.Authorization).toBe('Bearer acceso-caducado');
    expect(llamadas[2].cabeceras.Authorization).toBe('Bearer acceso-nuevo');
    // El refresh manda el refresh token y el email (lo exige Cognito si el client tiene secret), sin Bearer.
    expect(llamadas[1].cuerpo).toEqual({ refreshToken: 'refresh-1', email: 'docente.demo@example.com' });
    expect(llamadas[1].cabeceras.Authorization).toBeUndefined();
    // Se guardan los tokens nuevos y se conserva el refresh token.
    expect(sesion.leer()).toMatchObject({ accessToken: 'acceso-nuevo', refreshToken: 'refresh-1' });
  });

  it('varias peticiones con 401 a la vez comparten UNA sola renovación', async () => {
    const { llamadas } = simularFetch((l) => {
      if (l.url.endsWith('/api/auth/refresh')) return json(sobre(tokensNuevos));
      return l.cabeceras.Authorization === 'Bearer acceso-nuevo'
        ? json(sobre(catalogoDePrueba))
        : new Response(null, { status: 401 });
    });

    await Promise.all([obtenerCatalogo(), obtenerCatalogo(), obtenerCatalogo()]);

    expect(llamadas.filter((l) => l.url.endsWith('/api/auth/refresh'))).toHaveLength(1);
  });

  it('si el servidor rechaza el refresh token la sesión termina, sin bucle', async () => {
    const { llamadas } = simularFetch((l) =>
      l.url.endsWith('/api/auth/refresh') ? json({ error: 'UNAUTHORIZED', mensaje: 'x', status: 401 }, 401) : new Response(null, { status: 401 }),
    );

    const error = await obtenerCatalogo().catch((e: unknown) => e as ApiError);

    expect(error).toMatchObject({ status: 401, codigo: 'SESION_EXPIRADA' });
    expect(llamadas).toHaveLength(2);
    expect(sesion.leer()).toBeNull();
  });

  it('sin red al renovar se CONSERVA la sesión', async () => {
    simularFetch((l) => {
      if (l.url.endsWith('/api/auth/refresh')) throw new TypeError('Failed to fetch');
      return new Response(null, { status: 401 });
    });

    await expect(obtenerCatalogo()).rejects.toBeInstanceOf(ApiError);

    expect(sesion.leer()?.refreshToken).toBe('refresh-1');
  });

  it('un error 500 al renovar también conserva la sesión', async () => {
    simularFetch((l) => (l.url.endsWith('/api/auth/refresh') ? new Response(null, { status: 500 }) : new Response(null, { status: 401 })));

    await expect(obtenerCatalogo()).rejects.toBeInstanceOf(ApiError);

    expect(sesion.leer()).not.toBeNull();
  });

  it('sin refresh token un 401 cierra la sesión sin intentar renovar', async () => {
    sesion.guardar({ ...sesionDePrueba(), refreshToken: null });
    const { llamadas } = simularFetch(() => new Response(null, { status: 401 }));

    await expect(obtenerCatalogo()).rejects.toMatchObject({ codigo: 'SESION_EXPIRADA' });

    expect(llamadas).toHaveLength(1);
    expect(sesion.leer()).toBeNull();
  });

  it('un 401 repetido tras renovar no vuelve a renovar', async () => {
    const { llamadas } = simularFetch((l) =>
      l.url.endsWith('/api/auth/refresh') ? json(sobre(tokensNuevos)) : new Response(null, { status: 401 }),
    );

    await expect(obtenerCatalogo()).rejects.toBeInstanceOf(ApiError);

    expect(llamadas).toHaveLength(3);
  });

  it('un 403 NO intenta renovar: es falta de permiso, no un token vencido', async () => {
    const { llamadas } = simularFetch(() => new Response(null, { status: 403 }));

    await expect(obtenerResumen(12)).rejects.toMatchObject({ status: 403 });

    expect(llamadas).toHaveLength(1);
    expect(sesion.leer()).not.toBeNull();
  });
});
