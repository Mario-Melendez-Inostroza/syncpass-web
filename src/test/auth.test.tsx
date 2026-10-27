import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { Component, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../auth/AuthContext';
import { AccesoDenegadoError, useAuth } from '../auth/contexto';
import { sesion } from '../auth/sesion';
import { json, jwtDePrueba, simularFetch, sobre } from './ayudas';

const envoltorio = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;
const montar = () => renderHook(() => useAuth(), { wrapper: envoltorio });

/** Ejecuta [accion] dentro de act y devuelve el error que lanzó (o null si terminó bien). */
async function intentar(accion: () => Promise<void>): Promise<unknown> {
  try {
    await act(async () => {
      await accion();
    });
    return null;
  } catch (error) {
    return error;
  }
}

const loginOk = (grupos: string[] | null = ['COORDINADOR']) =>
  json(
    sobre({
      accessToken: 'acceso-1',
      idToken: jwtDePrueba({ grupos }),
      refreshToken: 'refresh-1',
      expiresIn: 3600,
    }),
  );

describe('iniciar sesión', () => {
  it('guarda los tokens que vienen DENTRO de data (el original guardaba la cadena "undefined")', async () => {
    simularFetch(() => loginOk());
    const { result } = montar();

    const error = await intentar(() => result.current.iniciarSesion('  docente.demo@example.com ', 'Clave-de-prueba-1!'));

    expect(error).toBeNull();
    const guardada = sesion.leer()!;
    expect(guardada.accessToken).toBe('acceso-1');
    expect(guardada.accessToken).not.toBe('undefined');
    expect(guardada.refreshToken).toBe('refresh-1');
    expect(guardada.email).toBe('docente.demo@example.com');
    expect(result.current.estado).toMatchObject({ tipo: 'activa', usuario: { nombre: 'Docente Demo' } });
  });

  it('manda exactamente email y password al login', async () => {
    const { llamadas } = simularFetch(() => loginOk());
    const { result } = montar();

    await intentar(() => result.current.iniciarSesion('docente.demo@example.com', 'Clave-de-prueba-1!'));

    expect(llamadas[0].url).toMatch(/\/api\/auth\/login$/);
    expect(llamadas[0].cuerpo).toEqual({ email: 'docente.demo@example.com', password: 'Clave-de-prueba-1!' });
  });

  it('un MONITOR no entra al panel y su sesión no se guarda', async () => {
    simularFetch(() => loginOk(['MONITOR']));
    const { result } = montar();

    const error = await intentar(() => result.current.iniciarSesion('monitor.demo@example.com', 'x'));

    expect(error).toBeInstanceOf(AccesoDenegadoError);
    expect((error as Error).message).toContain('usa la app Android');
    expect(sesion.leer()).toBeNull();
    expect(result.current.estado.tipo).toBe('anonimo');
  });

  it('un usuario sin grupo del caso no entra y se le explica por qué', async () => {
    simularFetch(() => loginOk(['USER', 'profesor']));
    const { result } = montar();

    const error = await intentar(() => result.current.iniciarSesion('x@example.com', 'x'));

    expect((error as Error).message).toContain('COORDINADOR');
    expect(sesion.leer()).toBeNull();
  });

  it('credenciales inválidas muestran el mensaje del backend y no guardan nada', async () => {
    simularFetch(() => json({ error: 'UNAUTHORIZED', mensaje: 'Credenciales inválidas', status: 401 }, 401));
    const { result } = montar();

    const error = await intentar(() => result.current.iniciarSesion('x@example.com', 'mala'));

    expect((error as Error).message).toBe('Credenciales inválidas');
    expect(sesion.leer()).toBeNull();
  });

  it('un login sin idToken es una respuesta incompleta', async () => {
    simularFetch(() => json(sobre({ accessToken: 'a', refreshToken: 'r' })));
    const { result } = montar();

    const error = await intentar(() => result.current.iniciarSesion('x@example.com', 'x'));

    expect((error as Error).message).toContain('incompleta');
    expect(sesion.leer()).toBeNull();
  });

  it('nunca consulta /api/health (era el bypass del original)', async () => {
    const { llamadas } = simularFetch(() => loginOk());
    const { result } = montar();

    await intentar(() => result.current.iniciarSesion('docente.demo@example.com', 'x'));

    expect(llamadas.some((l) => l.url.includes('/health'))).toBe(false);
  });
});

describe('sesión guardada', () => {
  it('una sesión válida de coordinador se restaura al abrir', () => {
    sesion.guardar({ accessToken: 'a', idToken: jwtDePrueba(), refreshToken: 'r', email: 'x@example.com' });

    const { result } = montar();

    expect(result.current.estado.tipo).toBe('activa');
  });

  it('un texto basura guardado como token NO da por autenticado a nadie', () => {
    // Con el original, cualquier cadena en localStorage (incluida "undefined") pasaba la comprobación de /health.
    sesion.guardar({ accessToken: 'undefined', idToken: 'undefined', refreshToken: null, email: '' });

    const { result } = montar();

    expect(result.current.estado.tipo).toBe('anonimo');
    expect(sesion.leer()).toBeNull();
  });

  it('una sesión guardada de un usuario sin rol de coordinador se descarta', () => {
    sesion.guardar({ accessToken: 'a', idToken: jwtDePrueba({ grupos: ['MONITOR'] }), refreshToken: 'r', email: 'x@example.com' });

    const { result } = montar();

    expect(result.current.estado.tipo).toBe('anonimo');
    expect(sesion.leer()).toBeNull();
  });

  it('si la sesión desaparece desde fuera (renovación rechazada), la interfaz vuelve al login', async () => {
    sesion.guardar({ accessToken: 'a', idToken: jwtDePrueba(), refreshToken: 'r', email: 'x@example.com' });
    const { result } = montar();
    expect(result.current.estado.tipo).toBe('activa');

    act(() => sesion.limpiar());

    await waitFor(() => expect(result.current.estado.tipo).toBe('anonimo'));
  });
});

describe('cerrar sesión', () => {
  const conSesion = () =>
    sesion.guardar({ accessToken: 'acceso-1', idToken: jwtDePrueba(), refreshToken: 'r', email: 'x@example.com' });

  it('avisa al servidor con el Bearer y borra la sesión', async () => {
    conSesion();
    const { llamadas } = simularFetch(() => json(sobre(null, 'Logout exitoso')));
    const { result } = montar();

    await intentar(() => result.current.cerrarSesion());

    expect(llamadas[0].url).toMatch(/\/api\/auth\/logout$/);
    expect(llamadas[0].cabeceras.Authorization).toBe('Bearer acceso-1');
    expect(sesion.leer()).toBeNull();
    expect(result.current.estado.tipo).toBe('anonimo');
  });

  it('sin red igualmente cierra la sesión en el navegador', async () => {
    conSesion();
    simularFetch(() => {
      throw new TypeError('Failed to fetch');
    });
    const { result } = montar();

    const error = await intentar(() => result.current.cerrarSesion());

    expect(error).toBeNull();
    expect(sesion.leer()).toBeNull();
  });
});

describe('useAuth', () => {
  it('fuera de <AuthProvider> falla con un mensaje claro', () => {
    // React imprime el error en consola aunque un límite lo capture; se silencia solo aquí.
    vi.spyOn(console, 'error').mockImplementation(() => {});

    class Limite extends Component<{ children: ReactNode }, { mensaje: string | null }> {
      state = { mensaje: null as string | null };
      static getDerivedStateFromError(error: Error) {
        return { mensaje: error.message };
      }
      render() {
        return this.state.mensaje ?? this.props.children;
      }
    }
    const Sonda = () => {
      useAuth();
      return null;
    };

    render(
      <Limite>
        <Sonda />
      </Limite>,
    );

    expect(screen.getByText(/AuthProvider/)).toBeInTheDocument();
  });
});
