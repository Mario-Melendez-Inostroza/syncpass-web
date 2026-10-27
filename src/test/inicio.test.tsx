import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { sesion } from '../auth/sesion';
import { catalogoDePrueba, json, jwtDePrueba, simularFetch, sobre } from './ayudas';

const ir = (hash: string) => {
  window.location.hash = hash;
};

beforeEach(() => ir('#/'));
afterEach(() => vi.unstubAllGlobals());

describe('página de inicio (sin sesión)', () => {
  it('la raíz muestra la página de inicio: titular, descripción y accesos', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Proyectos que conectan. Comunidades que avanzan.');
    expect(screen.getByText(/ayuda a coordinar proyectos comunitarios/i)).toBeInTheDocument();
    expect(screen.getByText('Plataforma de gestión comunitaria')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver servicios' })).toBeInTheDocument();
    // No es el formulario de ingreso.
    expect(screen.queryByLabelText('Correo')).not.toBeInTheDocument();
  });

  it('el menú tiene solo tres secciones: Inicio, Servicios y Contacto', () => {
    render(<App />);

    const nav = within(screen.getByRole('navigation', { name: 'Secciones' }));
    expect(nav.getAllByRole('button').map((b) => b.textContent)).toEqual(['Inicio', 'Servicios', 'Contacto']);
    expect(screen.getByRole('link', { name: 'SyncPass, inicio' })).toHaveAttribute('href', '#/');
  });

  it('Inicio está marcado como la sección actual al abrir', () => {
    render(<App />);

    const nav = within(screen.getByRole('navigation', { name: 'Secciones' }));
    expect(nav.getByRole('button', { name: 'Inicio' })).toHaveAttribute('aria-current', 'true');
    expect(nav.getByRole('button', { name: 'Servicios' })).not.toHaveAttribute('aria-current');
  });

  it('todos los "Iniciar sesión" llevan al formulario de ingreso', () => {
    render(<App />);

    const enlaces = screen.getAllByRole('link', { name: /Iniciar sesión/ });
    expect(enlaces.length).toBeGreaterThanOrEqual(3);
    for (const enlace of enlaces) expect(enlace).toHaveAttribute('href', '#/ingresar');
  });

  it('Servicios: los seis servicios reales de la plataforma', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 2, name: /Todo lo que necesitas en una sola plataforma/ })).toBeInTheDocument();
    for (const titulo of [
      'Funciona sin conexión',
      'Registro por QR',
      'Quórum en vivo',
      'Encuestas al instante',
      'Reportes en Excel',
      'Gestión de proyectos y eventos',
    ]) {
      expect(screen.getByRole('heading', { level: 3, name: titulo })).toBeInTheDocument();
    }
  });

  it('Cómo funciona: tres pasos en orden, Planifica, Registra y Mide', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 2, name: /Del plan al informe, en tres pasos/ })).toBeInTheDocument();
    const titulos = ['Planifica', 'Registra', 'Mide'].map((t) => screen.getByRole('heading', { level: 3, name: t }));
    for (let i = 1; i < titulos.length; i++) {
      expect(titulos[i - 1].compareDocumentPosition(titulos[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });

  it('la página no dice "datos ficticios" ni nada parecido', () => {
    render(<App />);

    expect(document.body.textContent).not.toMatch(/fictici/i);
  });
  it('las metas son las del caso y dicen que son objetivos, no mediciones', () => {
    render(<App />);

    for (const meta of ['< 5 s', '> 65 %', '-80 %', '100 %']) expect(screen.getByText(meta)).toBeInTheDocument();
    expect(screen.getByText(/Son objetivos del proyecto, todavía no mediciones/)).toBeInTheDocument();
    // Ya no están las cifras ilustrativas del diseño anterior.
    expect(screen.queryByText('+60%')).not.toBeInTheDocument();
    expect(screen.queryByText('+85%')).not.toBeInTheDocument();
  });

  it('no usa imágenes: ni el portátil ni los celulares del diseño anterior', () => {
    const { container } = render(<App />);

    expect(container.querySelectorAll('img')).toHaveLength(0);
    const estilos = [...container.querySelectorAll<HTMLElement>('[style]')].map((e) => e.getAttribute('style'));
    expect(estilos.join(' ')).not.toContain('.png');
  });

  it('Contacto: explica cómo obtener una cuenta y no publica datos personales', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 2, name: /¿Listo para conectar a tu comunidad\?/ })).toBeInTheDocument();
    expect(screen.getByText(/las cuentas de coordinador y de monitor las crea el equipo/)).toBeInTheDocument();
    const texto = document.body.textContent ?? '';
    expect(texto).not.toMatch(/@\w+\.\w+/);
    expect(texto).not.toMatch(/\+?\d[\d ]{8,}\d/);
  });

  it('los botones del menú desplazan a su sección SIN cambiar la ruta (la ruta vive en el hash)', async () => {
    const desplazar = vi.fn();
    Element.prototype.scrollIntoView = desplazar;
    render(<App />);

    await userEvent.click(within(screen.getByRole('navigation', { name: 'Secciones' })).getByRole('button', { name: 'Contacto' }));

    expect(desplazar).toHaveBeenCalledTimes(1);
    expect(window.location.hash).toBe('#/');
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('"Ver servicios" también desplaza a la sección de servicios', async () => {
    const desplazar = vi.fn();
    Element.prototype.scrollIntoView = desplazar;
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'Ver servicios' }));

    expect(desplazar).toHaveBeenCalledTimes(1);
    expect(window.location.hash).toBe('#/');
  });

  it('no queda ningún enlace con ancla suelta (#seccion) que rompería el enrutado por hash', () => {
    const { container } = render(<App />);

    const sueltos = [...container.querySelectorAll('a[href^="#"]')].filter((a) => !a.getAttribute('href')!.startsWith('#/'));
    expect(sueltos).toHaveLength(0);
  });

  it('con IntersectionObserver la sección visible se marca en el menú', async () => {
    let avisar: (e: Partial<IntersectionObserverEntry>[]) => void = () => {};
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: IntersectionObserverCallback) {
          avisar = (e) => callback(e as IntersectionObserverEntry[], this as unknown as IntersectionObserver);
        }
        observe() {}
        disconnect() {}
      },
    );
    render(<App />);

    const servicios = document.getElementById('servicios')!;
    avisar([{ target: servicios, isIntersecting: true, intersectionRatio: 0.8 }]);

    const nav = within(screen.getByRole('navigation', { name: 'Secciones' }));
    await waitFor(() => expect(nav.getByRole('button', { name: 'Servicios' })).toHaveAttribute('aria-current', 'true'));
    expect(nav.getByRole('button', { name: 'Inicio' })).not.toHaveAttribute('aria-current');
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

  it('con sesión la raíz es el panel, no la página de inicio', async () => {
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

  it('tras iniciar sesión desde la página de inicio se llega al panel', async () => {
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

describe('panel del coordinador: cabecera y resumen', () => {
  const entrarComoCoordinador = () => {
    sesion.guardar({ accessToken: 'a', idToken: jwtDePrueba({ nombre: 'Docente Demo' }), refreshToken: 'r', email: 'docente.demo@example.com' });
    simularFetch(() => json(sobre(catalogoDePrueba)));
  };

  it('la cabecera muestra el logo, el menú, el nombre y el rol del usuario', async () => {
    entrarComoCoordinador();
    render(<App />);

    expect(await screen.findByText('Docente Demo')).toBeInTheDocument();
    expect(screen.getByText('Coordinador')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'SyncPass, panel del coordinador' })).toHaveAttribute('href', '#/');
    const menu = within(screen.getByRole('navigation', { name: 'Panel' }));
    expect(menu.getByRole('link', { name: 'Eventos' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
  });

  it('el resumen usa las cifras reales del catálogo descargado', async () => {
    entrarComoCoordinador();
    render(<App />);

    await screen.findByText('Alfabetización digital');
    const resumen = within(document.querySelector('dl')!);
    const cifra = (etiqueta: string) => resumen.getByText(etiqueta).parentElement!.querySelector('dd')!.textContent;
    expect(cifra('Proyectos')).toBe('1');
    expect(cifra('Eventos')).toBe('2');
    expect(cifra('Personas en el catálogo')).toBe('0');
  });

  it('cada evento muestra el día y el mes de su fecha', async () => {
    entrarComoCoordinador();
    render(<App />);

    const enlace = await screen.findByRole('link', { name: /Taller de correo electrónico/ });
    // 2026-10-28T15:00Z: el día puede ser 28 en cualquier zona horaria razonable; el mes, OCT.
    expect(enlace.textContent).toMatch(/(27|28)/);
    expect(enlace.textContent).toContain('OCT');
  });
});
