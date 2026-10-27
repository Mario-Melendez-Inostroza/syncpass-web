import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { sesion } from '../auth/sesion';
import { REFRESCO_QUORUM_MS } from '../config';
import { catalogoDePrueba, json, jwtDePrueba, resumenDePrueba, simularFetch, sobre, type LlamadaFetch } from './ayudas';

const ir = (hash: string) => {
  window.location.hash = hash;
};

const iniciarComoCoordinador = () =>
  sesion.guardar({
    accessToken: 'acceso-1',
    idToken: jwtDePrueba({ nombre: 'Docente Demo' }),
    refreshToken: 'refresh-1',
    email: 'docente.demo@example.com',
  });

/** Servidor falso con las rutas que usa el panel; cada prueba puede sobrescribir una. */
function servidor(sobrescribir: (l: LlamadaFetch) => Response | undefined = () => undefined) {
  return simularFetch((l) => {
    const propia = sobrescribir(l);
    if (propia) return propia;
    if (l.url.endsWith('/api/sync/catalogo')) return json(sobre(catalogoDePrueba));
    if (/\/api\/eventos\/12\/resumen$/.test(l.url)) return json(sobre(resumenDePrueba));
    if (l.url.endsWith('/api/auth/logout')) return json(sobre(null, 'Logout exitoso'));
    return new Response(null, { status: 404 });
  });
}

beforeEach(() => ir('#/'));

describe('login', () => {
  // Sin sesión la raíz es la página de inicio; el formulario de ingreso vive en /ingresar.
  beforeEach(() => ir('#/ingresar'));

  it('sin sesión se ve el login, también en una dirección interna', () => {
    ir('#/eventos/12');
    render(<App />);

    expect(screen.getByRole('heading', { name: 'SyncPass' })).toBeInTheDocument();
    expect(screen.getByLabelText('Correo')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
  });

  it('con los campos vacíos avisa y NO llama al servidor', async () => {
    const { doble } = servidor();
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Escribe tu correo y tu contraseña');
    expect(doble).not.toHaveBeenCalled();
  });

  it('un login rechazado muestra el mensaje del backend', async () => {
    servidor((l) =>
      l.url.endsWith('/api/auth/login') ? json({ error: 'UNAUTHORIZED', mensaje: 'Credenciales inválidas', status: 401 }, 401) : undefined,
    );
    render(<App />);

    await userEvent.type(screen.getByLabelText('Correo'), 'docente.demo@example.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'mala');
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales inválidas');
    expect(sesion.leer()).toBeNull();
  });

  it('un monitor recibe la explicación y no entra', async () => {
    servidor((l) =>
      l.url.endsWith('/api/auth/login')
        ? json(sobre({ accessToken: 'a', idToken: jwtDePrueba({ grupos: ['MONITOR'] }), refreshToken: 'r' }))
        : undefined,
    );
    render(<App />);

    await userEvent.type(screen.getByLabelText('Correo'), 'monitor.demo@example.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'Clave-de-prueba-1!');
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('usa la app Android');
    expect(screen.queryByText('Eventos')).not.toBeInTheDocument();
  });

  it('un login correcto lleva a la lista de eventos, de punta a punta', async () => {
    servidor((l) =>
      l.url.endsWith('/api/auth/login')
        ? json(sobre({ accessToken: 'acceso-1', idToken: jwtDePrueba(), refreshToken: 'refresh-1' }))
        : undefined,
    );
    render(<App />);

    await userEvent.type(screen.getByLabelText('Correo'), 'docente.demo@example.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'Clave-de-prueba-1!');
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByText('Alfabetización digital')).toBeInTheDocument();
    expect(sesion.leer()?.accessToken).toBe('acceso-1');
  });
});

describe('lista de eventos', () => {
  it('agrupa por proyecto y enlaza cada evento a su quórum', async () => {
    iniciarComoCoordinador();
    servidor();
    render(<App />);

    expect(await screen.findByText('Alfabetización digital')).toBeInTheDocument();
    expect(screen.getByText('En curso')).toBeInTheDocument();
    const enlace = screen.getByRole('link', { name: /Taller de correo electrónico/ });
    expect(enlace).toHaveAttribute('href', '#/eventos/12');
    expect(screen.getByRole('link', { name: /Taller de seguridad en línea/ })).toHaveAttribute('href', '#/eventos/13');
    // Ordenados por fecha: el de octubre antes que el de noviembre.
    const enlaces = screen.getAllByRole('link', { name: /Ver quórum/ });
    expect(enlaces[0]).toHaveTextContent('Taller de correo electrónico');
  });

  it('muestra el nombre del usuario y permite cerrar sesión', async () => {
    iniciarComoCoordinador();
    servidor();
    render(<App />);

    expect(await screen.findByText('Docente Demo')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    // Al cerrar sesión se vuelve a la página de inicio pública.
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Proyectos que conectan');
    expect(sesion.leer()).toBeNull();
  });

  it('sin catálogo explica que todavía no hay nada', async () => {
    iniciarComoCoordinador();
    servidor((l) =>
      l.url.endsWith('/api/sync/catalogo') ? json(sobre({ servidorEn: 'x', proyectos: [], eventos: [], asistentes: [] })) : undefined,
    );
    render(<App />);

    expect(await screen.findByText('Todavía no hay proyectos ni eventos.')).toBeInTheDocument();
  });

  it('un error de red se muestra con la opción de reintentar, y reintentar funciona', async () => {
    iniciarComoCoordinador();
    let falla = true;
    servidor((l) => {
      if (l.url.endsWith('/api/sync/catalogo') && falla) throw new TypeError('Failed to fetch');
      return undefined;
    });
    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Sin conexión');
    falla = false;
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('Alfabetización digital')).toBeInTheDocument();
  });

  it('si la renovación es rechazada, la pantalla vuelve al login sola', async () => {
    iniciarComoCoordinador();
    servidor((l) => {
      if (l.url.endsWith('/api/auth/refresh')) return json({ error: 'UNAUTHORIZED', mensaje: 'x', status: 401 }, 401);
      if (l.url.endsWith('/api/sync/catalogo')) return new Response(null, { status: 401 });
      return undefined;
    });
    render(<App />);
    // Con la renovación rechazada la sesión termina y se vuelve a la página de inicio pública.
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Proyectos que conectan'));
    expect(sesion.leer()).toBeNull();
  });
});

describe('quórum del evento', () => {
  it('muestra la asistencia, la ubicación y la satisfacción', async () => {
    iniciarComoCoordinador();
    servidor();
    ir('#/eventos/12');
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Taller de correo electrónico' })).toBeInTheDocument();
    expect(screen.getByText('de 30 cupos')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Cupos ocupados' })).toHaveAttribute('aria-valuenow', '18');
    expect(screen.getByRole('progressbar', { name: 'Dentro del radio del evento' })).toHaveAttribute('aria-valuenow', '16');
    expect(screen.getByRole('progressbar', { name: 'Fuera del radio' })).toHaveAttribute('aria-valuenow', '1');
    expect(screen.getByText('4,4 / 5')).toBeInTheDocument();
    expect(screen.getByText('4,1 / 5')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
    expect(screen.getByText(/78 % de los marcados/)).toBeInTheDocument();
  });

  it('un evento sin cupo definido ni encuestas no rompe y lo explica', async () => {
    iniciarComoCoordinador();
    servidor((l) =>
      /\/resumen$/.test(l.url)
        ? json(
            sobre({
              ...resumenDePrueba,
              cuposMaximos: null,
              totalMarcados: 0,
              validas: 0,
              fueraDeRadio: 0,
              sinUbicacion: 0,
              encuestasRecibidas: 0,
              satisfaccionPromedio: null,
              utilidadPromedio: null,
              primeraMarcacion: null,
              ultimaMarcacion: null,
            }),
          )
        : undefined,
    );
    ir('#/eventos/12');
    render(<App />);

    expect(await screen.findByText(/Todavía no hay marcaciones sincronizadas/)).toBeInTheDocument();
    expect(screen.getByText('Sin cupo máximo definido')).toBeInTheDocument();
    expect(screen.getByText(/Todavía no hay encuestas sincronizadas/)).toBeInTheDocument();
    expect(screen.getAllByText('— / 5')).toHaveLength(2);
  });

  it('un 403 explica que falta permiso', async () => {
    iniciarComoCoordinador();
    servidor((l) => (/\/resumen$/.test(l.url) ? new Response(null, { status: 403 }) : undefined));
    ir('#/eventos/12');
    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent('No tienes permiso');
  });

  it('un evento inexistente muestra el mensaje del backend', async () => {
    iniciarComoCoordinador();
    servidor((l) =>
      /\/resumen$/.test(l.url) ? json({ error: 'NOT_FOUND', mensaje: 'El evento no existe', status: 404 }, 404) : undefined,
    );
    ir('#/eventos/12');
    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent('El evento no existe');
  });

  it('un id que no es un número positivo es página no encontrada', async () => {
    iniciarComoCoordinador();
    servidor();
    ir('#/eventos/abc');
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument();
  });

  it('se puede volver a la lista de eventos', async () => {
    iniciarComoCoordinador();
    servidor();
    ir('#/eventos/12');
    render(<App />);

    await userEvent.click(await screen.findByRole('link', { name: /Volver a los eventos/ }));

    expect(await screen.findByRole('heading', { name: 'Eventos' })).toBeInTheDocument();
  });
});

describe('monitoreo en vivo', () => {
  const pedidosDeResumen = (llamadas: LlamadaFetch[]) => llamadas.filter((l) => /\/resumen$/.test(l.url)).length;

  it('vuelve a pedir el quórum cada 15 s y se puede apagar', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    iniciarComoCoordinador();
    const { llamadas } = servidor();
    ir('#/eventos/12');
    render(<App />);
    await screen.findByRole('heading', { name: 'Taller de correo electrónico' });
    expect(pedidosDeResumen(llamadas)).toBe(1);

    await act(() => vi.advanceTimersByTimeAsync(REFRESCO_QUORUM_MS));
    expect(pedidosDeResumen(llamadas)).toBe(2);

    // Al apagar "En vivo" deja de actualizarse.
    const interruptor = screen.getByRole('checkbox', { name: /En vivo/ });
    await act(async () => {
      interruptor.click();
    });
    await act(() => vi.advanceTimersByTimeAsync(REFRESCO_QUORUM_MS * 3));
    expect(pedidosDeResumen(llamadas)).toBe(2);
  });

  it('si falla una actualización conserva los últimos datos y avisa', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    iniciarComoCoordinador();
    let cortado = false;
    servidor((l) => {
      if (/\/resumen$/.test(l.url) && cortado) throw new TypeError('Failed to fetch');
      return undefined;
    });
    ir('#/eventos/12');
    render(<App />);
    await screen.findByText('4,4 / 5');

    cortado = true;
    await act(() => vi.advanceTimersByTimeAsync(REFRESCO_QUORUM_MS));

    const aviso = await screen.findByRole('alert');
    expect(within(aviso).getByText(/No se pudo actualizar/)).toBeInTheDocument();
    expect(screen.getByText('4,4 / 5')).toBeInTheDocument(); // los datos no desaparecen
    await waitFor(() => expect(screen.queryByText('Cargando el quórum…')).not.toBeInTheDocument());
  });
});
