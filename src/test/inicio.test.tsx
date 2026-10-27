import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { sesion } from '../auth/sesion';
import { catalogoDePrueba, json, jwtDePrueba, simularFetch, sobre } from './ayudas';

const ir = (hash: string) => {
  window.location.hash = hash;
};

beforeEach(() => ir('#/'));

describe('página de inicio (sin sesión)', () => {
  it('la raíz muestra la landing: titular, descripción y los dos accesos principales', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Proyectos que conectan. Comunidades que avanzan.');
    expect(screen.getByText(/plataforma integral para la gestión de proyectos comunitarios/i)).toBeInTheDocument();
    expect(screen.getByText('PLATAFORMA DE GESTIÓN COMUNITARIA', { exact: false })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Conocer la plataforma/ })).toBeInTheDocument();
    // No es el formulario de ingreso.
    expect(screen.queryByLabelText('Correo')).not.toBeInTheDocument();
  });

  it('todos los "Iniciar sesión" llevan al formulario de ingreso', () => {
    render(<App />);

    const enlaces = screen.getAllByRole('link', { name: /Iniciar sesión/ });
    expect(enlaces.length).toBeGreaterThanOrEqual(3);
    for (const enlace of enlaces) expect(enlace).toHaveAttribute('href', '#/ingresar');
  });

  it('la cabecera tiene el logo y las seis secciones de la referencia, en ese orden', () => {
    render(<App />);

    expect(screen.getByRole('link', { name: 'SyncPass, inicio' })).toHaveAttribute('href', '#/');
    const nav = within(screen.getByRole('navigation', { name: 'Secciones' }));
    expect(nav.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Inicio',
      'Características',
      'Funcionalidades',
      'Impacto',
      'Tecnología',
      'Contacto',
    ]);
  });

  it('las cuatro ventajas del hero', () => {
    render(<App />);

    for (const texto of ['Registro rápido y seguro', 'Funciona sin conexión', 'Reportes en tiempo real', 'Datos protegidos y confiables']) {
      expect(screen.getByText(texto)).toBeInTheDocument();
    }
  });

  it('"Todo lo que necesitas": las cuatro tarjetas de funcionalidades', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 2, name: /Todo lo que necesitas en una sola plataforma/ })).toBeInTheDocument();
    for (const titulo of ['Gestión de proyectos', 'Eventos y actividades', 'Registro de asistencias', 'Encuestas y reportes']) {
      expect(screen.getByRole('heading', { level: 3, name: titulo })).toBeInTheDocument();
    }
    expect(screen.getByRole('link', { name: /Conoce todas las funcionalidades/ })).toHaveAttribute('href', '#/ingresar');
  });

  it('"Impacto real": tres cifras y la cita', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 2, name: /Datos que impulsan comunidades más fuertes/ })).toBeInTheDocument();
    expect(screen.getByText('+60%')).toBeInTheDocument();
    expect(screen.getByText('+85%')).toBeInTheDocument();
    expect(screen.getByText('-50%')).toBeInTheDocument();
    expect(screen.getByText(/Información confiable para construir un mayor impacto social/)).toBeInTheDocument();
  });

  it('el fondo del hero es la imagen entregada, servida desde /assets', () => {
    const { container } = render(<App />);

    const fondo = container.querySelector<HTMLElement>('#inicio > div[aria-hidden]');
    expect(fondo?.style.backgroundImage).toContain('assets/fondo_hero.png');
  });

  it('los botones de la cabecera desplazan a su sección SIN cambiar la ruta (la ruta vive en el hash)', async () => {
    const desplazar = vi.fn();
    Element.prototype.scrollIntoView = desplazar;
    render(<App />);

    await userEvent.click(within(screen.getByRole('navigation', { name: 'Secciones' })).getByRole('button', { name: 'Impacto' }));

    expect(desplazar).toHaveBeenCalledTimes(1);
    expect(window.location.hash).toBe('#/');
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('no queda ningún enlace con ancla suelta (#seccion) que rompería el enrutado por hash', () => {
    const { container } = render(<App />);

    const sueltos = [...container.querySelectorAll('a[href^="#"]')].filter((a) => !a.getAttribute('href')!.startsWith('#/'));
    expect(sueltos).toHaveLength(0);
  });

  it('Contacto no publica ningún dato personal', () => {
    render(<App />);

    const texto = document.body.textContent ?? '';
    expect(texto).not.toMatch(/@\w+\.\w+/);
    expect(texto).not.toMatch(/\+?\d[\d ]{8,}\d/);
  });
});

describe('enrutado entre inicio, ingreso y panel', () => {
  it('"Iniciar sesión" abre el formulario de ingreso', async () => {
    render(<App />);

    await userEvent.click(screen.getAllByRole('link', { name: /Iniciar sesión/ })[0]);

    expect(await screen.findByLabelText('Correo')).toBeInTheDocument();
    expect(window.location.hash).toBe('#/ingresar');
  });

  it('el ingreso ofrece volver al inicio', async () => {
    ir('#/ingresar');
    render(<App />);

    await userEvent.click(await screen.findByRole('link', { name: /Volver al inicio/ }));

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Proyectos que conectan');
  });

  it('cualquier otra dirección sin sesión sigue pidiendo iniciar sesión', () => {
    ir('#/eventos/12');
    render(<App />);

    expect(screen.getByLabelText('Correo')).toBeInTheDocument();
  });

  it('con sesión la raíz es el panel, no la landing', async () => {
    sesion.guardar({ accessToken: 'a', idToken: jwtDePrueba(), refreshToken: 'r', email: 'docente.demo@example.com' });
    simularFetch(() => json(sobre(catalogoDePrueba)));
    render(<App />);

    expect(await screen.findByText('Alfabetización digital')).toBeInTheDocument();
    expect(screen.queryByText('Proyectos que conectan.', { exact: false })).not.toBeInTheDocument();
  });

  it('un usuario que ya entró y llega a /ingresar es llevado al panel', async () => {
    sesion.guardar({ accessToken: 'a', idToken: jwtDePrueba(), refreshToken: 'r', email: 'docente.demo@example.com' });
    simularFetch(() => json(sobre(catalogoDePrueba)));
    ir('#/ingresar');
    render(<App />);

    expect(await screen.findByText('Alfabetización digital')).toBeInTheDocument();
    await waitFor(() => expect(window.location.hash).toBe('#/'));
  });

  it('tras iniciar sesión desde la landing se llega al panel', async () => {
    simularFetch((l) =>
      l.url.endsWith('/api/auth/login')
        ? json(sobre({ accessToken: 'acceso-1', idToken: jwtDePrueba(), refreshToken: 'refresh-1' }))
        : json(sobre(catalogoDePrueba)),
    );
    render(<App />);

    await userEvent.click(screen.getAllByRole('link', { name: /Iniciar sesión/ })[0]);
    await userEvent.type(await screen.findByLabelText('Correo'), 'docente.demo@example.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'Clave-de-prueba-1!');
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByText('Alfabetización digital')).toBeInTheDocument();
    await waitFor(() => expect(window.location.hash).toBe('#/'));
  });
});
