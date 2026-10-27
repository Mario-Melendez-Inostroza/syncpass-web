import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { sesion } from '../auth/sesion';
import { json, jwtDePrueba, simularFetch, sobre, type LlamadaFetch } from './ayudas';

const ir = (hash: string) => {
  window.location.hash = hash;
};

const perfil = { id: 7, codigo: 'REG-AB12CD34', tipo: 'VECINO', qr: 'ASISTENTE_7' };

const taller = (sobrescribir: object = {}) => ({
  id: 12,
  nombre: 'Taller de correo electrónico',
  proyecto: 'Alfabetización digital',
  fechaHoraProgramada: '2026-10-28T15:00:00Z',
  recinto: 'Sede UV-12',
  cuposMaximos: 30,
  inscritos: 4,
  cuposDisponibles: 26,
  inscrito: false,
  ...sobrescribir,
});

const entrarComoAsistente = () =>
  sesion.guardar({
    accessToken: 'a',
    idToken: jwtDePrueba({ grupos: ['ASISTENTE'], email: 'vecina@example.com', nombre: 'Vecina Demo' }),
    refreshToken: 'r',
    email: 'vecina@example.com',
  });

beforeEach(() => {
  sesion.limpiar();
  ir('#/');
});
afterEach(() => vi.unstubAllGlobals());

describe('registro del asistente', () => {
  it('el ingreso ofrece crear una cuenta de asistente', async () => {
    ir('#/ingresar');
    render(<App />);

    await userEvent.click(await screen.findByRole('link', { name: /crear mi cuenta/i }));

    expect(await screen.findByText('Crear mi cuenta de asistente')).toBeInTheDocument();
    expect(window.location.hash).toBe('#/registro');
  });

  it('valida el correo y la contraseña antes de llamar al servidor', async () => {
    const { doble } = simularFetch(() => json(sobre(null)));
    ir('#/registro');
    render(<App />);

    await userEvent.type(await screen.findByLabelText('Correo'), 'sin-arroba');
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(screen.getByRole('alert')).toHaveTextContent('correo válido');

    await userEvent.clear(screen.getByLabelText('Correo'));
    await userEvent.type(screen.getByLabelText('Correo'), 'vecina@example.com');
    await userEvent.type(screen.getByLabelText(/Contraseña/), 'corta');
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(screen.getByRole('alert')).toHaveTextContent('8 caracteres');
    expect(doble).not.toHaveBeenCalled();
  });

  it('crea la cuenta con el tipo elegido, inicia sesión sola y muestra los talleres', async () => {
    const llamadas: LlamadaFetch[] = [];
    simularFetch((l) => {
      llamadas.push(l);
      if (l.url.endsWith('/api/auth/registro-asistente')) return json(sobre(perfil));
      if (l.url.endsWith('/api/auth/login')) {
        return json(sobre({ accessToken: 'acc', idToken: jwtDePrueba({ grupos: ['ASISTENTE'] }), refreshToken: 'ref' }));
      }
      return json(sobre([taller()]));
    });
    ir('#/registro');
    render(<App />);

    await userEvent.type(await screen.findByLabelText('Correo'), 'vecina@example.com');
    await userEvent.type(screen.getByLabelText(/Contraseña/), 'Clave-segura-1');
    await userEvent.selectOptions(screen.getByLabelText('Soy'), 'ESTUDIANTE');
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByText('Taller de correo electrónico')).toBeInTheDocument();
    const registro = llamadas.find((l) => l.url.endsWith('/api/auth/registro-asistente'))!;
    expect(registro.metodo).toBe('POST');
    expect(registro.cuerpo).toEqual({ email: 'vecina@example.com', password: 'Clave-segura-1', tipo: 'ESTUDIANTE' });
  });

  it('muestra el error del servidor si el correo ya existe', async () => {
    simularFetch(() => json({ error: 'CONFLICT', mensaje: 'Ese correo ya está registrado.', status: 409 }, 409));
    ir('#/registro');
    render(<App />);

    await userEvent.type(await screen.findByLabelText('Correo'), 'vecina@example.com');
    await userEvent.type(screen.getByLabelText(/Contraseña/), 'Clave-segura-1');
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Ese correo ya está registrado.');
  });
});

describe('panel del asistente', () => {
  it('solo ve Talleres y Mi credencial, no las pantallas del equipo', async () => {
    entrarComoAsistente();
    simularFetch(() => json(sobre([taller()])));
    render(<App />);

    expect(await screen.findByText('Taller de correo electrónico')).toBeInTheDocument();
    expect(screen.getByText('Asistente')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mi credencial' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Informes' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Asistentes' })).not.toBeInTheDocument();
  });

  it('una dirección del equipo no le muestra datos: es "no encontrada"', async () => {
    entrarComoAsistente();
    simularFetch(() => json(sobre([])));
    ir('#/informes');
    render(<App />);

    expect(await screen.findByText('Página no encontrada')).toBeInTheDocument();
  });

  it('se inscribe y se refresca la lista con el cupo ocupado', async () => {
    entrarComoAsistente();
    let inscrito = false;
    const { llamadas } = simularFetch((l) => {
      if (l.url.endsWith('/inscripcion') && l.metodo === 'POST') {
        inscrito = true;
        return json(sobre(null), 201);
      }
      return json(sobre([taller(inscrito ? { inscrito: true, cuposDisponibles: 25 } : {})]));
    });
    render(<App />);

    await userEvent.click(await screen.findByRole('button', { name: 'Inscribirme' }));

    expect(await screen.findByRole('button', { name: 'Cancelar inscripción' })).toBeInTheDocument();
    expect(screen.getByText('Inscrito')).toBeInTheDocument();
    expect(llamadas.some((l) => l.metodo === 'POST' && l.url.endsWith('/api/mi/talleres/12/inscripcion'))).toBe(true);
  });

  it('muestra el 409 del servidor y no permite inscribirse en un taller sin cupos', async () => {
    entrarComoAsistente();
    simularFetch((l) =>
      l.metodo === 'POST'
        ? json({ error: 'CONFLICT', mensaje: 'Ya estás inscrito en este taller.', status: 409 }, 409)
        : json(sobre([taller(), taller({ id: 13, nombre: 'Taller lleno', cuposDisponibles: 0 })])),
    );
    render(<App />);

    await userEvent.click((await screen.findAllByRole('button', { name: 'Inscribirme' }))[0]);
    expect(await screen.findByRole('alert')).toHaveTextContent('Ya estás inscrito en este taller.');
    expect(screen.getByText('Sin cupos disponibles')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Inscribirme' })[1]).toBeDisabled();
  });

  it('Mi credencial muestra el QR con el formato que lee la app del monitor y el código', async () => {
    entrarComoAsistente();
    simularFetch(() => json(sobre(perfil)));
    ir('#/credencial');
    render(<App />);

    expect(await screen.findByText('REG-AB12CD34')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Mi código QR REG-AB12CD34' }).querySelector('path')?.getAttribute('d')).toMatch(/^M\d+ \d+h1v1h-1z/);
    await waitFor(() => expect(screen.getByText(/Vecino · SyncPass/)).toBeInTheDocument());
  });
});
