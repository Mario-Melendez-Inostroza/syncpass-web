import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import {
  actualizarEvento,
  actualizarProyecto,
  crearEvento,
  crearProyecto,
  eliminarEvento,
  eliminarProyecto,
  obtenerAsistenciasEvento,
} from '../api/endpoints';
import type { EventoEntrada, ProyectoEntrada } from '../api/tipos';
import { sesion } from '../auth/sesion';
import { API_BASE_URL } from '../config';
import { catalogoDePrueba, json, jwtDePrueba, resumenDePrueba, simularFetch, sobre, type LlamadaFetch } from './ayudas';

const proyectoEntrada: ProyectoEntrada = {
  titulo: 'Huerta comunitaria',
  descripcion: null,
  areaTematica: 'emprendimiento',
  unidadVecinal: 'UV-5',
  fechaInicio: '2026-09-01',
  fechaTermino: null,
  estado: 'PLANIFICADO',
};

const eventoEntrada: EventoEntrada = {
  proyectoId: 1,
  nombre: 'Taller de compostaje',
  fechaHoraProgramada: '2026-11-20T18:00:00.000Z',
  cuposMaximos: 25,
  quorumMinimo: null,
  recinto: null,
  latitud: -33.45,
  longitud: -70.66,
  radioMetros: 200,
};

const iniciarComoCoordinador = () =>
  sesion.guardar({
    accessToken: 'acceso-1',
    idToken: jwtDePrueba({ nombre: 'Docente Demo' }),
    refreshToken: 'refresh-1',
    email: 'docente.demo@example.com',
  });

const ir = (hash: string) => {
  window.location.hash = hash;
};

beforeEach(() => {
  iniciarComoCoordinador();
  ir('#/');
});

describe('endpoints de gestión: contrato con el backend', () => {
  it('crear proyecto: POST /api/proyectos con el cuerpo tal cual', async () => {
    const { llamadas } = simularFetch(() => json(sobre({ id: 9 }), 201));

    await crearProyecto(proyectoEntrada);

    expect(llamadas[0].metodo).toBe('POST');
    expect(llamadas[0].url).toBe(`${API_BASE_URL}/api/proyectos`);
    expect(llamadas[0].cuerpo).toEqual(proyectoEntrada);
    expect(llamadas[0].cabeceras.Authorization).toBe('Bearer acceso-1');
  });

  it('editar y eliminar proyecto usan PUT y DELETE sobre /api/proyectos/{id}', async () => {
    const { llamadas } = simularFetch(() => json(sobre(null)));

    await actualizarProyecto(3, proyectoEntrada);
    await eliminarProyecto(3);

    expect(llamadas[0]).toMatchObject({ metodo: 'PUT', url: `${API_BASE_URL}/api/proyectos/3`, cuerpo: proyectoEntrada });
    expect(llamadas[1]).toMatchObject({ metodo: 'DELETE', url: `${API_BASE_URL}/api/proyectos/3`, cuerpo: undefined });
  });

  it('crear, editar y eliminar evento usan /api/eventos', async () => {
    const { llamadas } = simularFetch(() => json(sobre(null)));

    await crearEvento(eventoEntrada);
    await actualizarEvento(12, eventoEntrada);
    await eliminarEvento(12);

    expect(llamadas.map((l) => `${l.metodo} ${l.url.replace(API_BASE_URL, '')}`)).toEqual([
      'POST /api/eventos',
      'PUT /api/eventos/12',
      'DELETE /api/eventos/12',
    ]);
    expect(llamadas[0].cuerpo).toEqual(eventoEntrada);
  });

  it('asistencias de un evento: GET /api/eventos/{id}/asistencias', async () => {
    const { llamadas } = simularFetch(() => json(sobre([{ codigo: 'ASI-0001' }])));

    const filas = await obtenerAsistenciasEvento(12);

    expect(llamadas[0].url).toBe(`${API_BASE_URL}/api/eventos/12/asistencias`);
    expect(filas[0].codigo).toBe('ASI-0001');
  });
});

/** Servidor falso con el catálogo y las rutas de gestión; cada prueba puede sobrescribir una. */
function servidor(sobrescribir: (l: LlamadaFetch) => Response | undefined = () => undefined) {
  return simularFetch((l) => {
    const propia = sobrescribir(l);
    if (propia) return propia;
    if (l.url.endsWith('/api/sync/catalogo')) return json(sobre(catalogoDePrueba));
    if (/\/api\/eventos\/12\/resumen$/.test(l.url)) return json(sobre(resumenDePrueba));
    if (/\/api\/eventos\/12\/comentarios$/.test(l.url)) return json(sobre([]));
    if (l.metodo === 'POST' || l.metodo === 'PUT') return json(sobre({ id: 99 }), l.metodo === 'POST' ? 201 : 200);
    if (l.metodo === 'DELETE') return json(sobre(null));
    return new Response(null, { status: 404 });
  });
}

const llamadasDe = (llamadas: LlamadaFetch[], metodo: string) => llamadas.filter((l) => l.metodo === metodo);

describe('lista de eventos: accesos de gestión', () => {
  it('ofrece crear proyecto y, en cada proyecto, editarlo y crearle un evento', async () => {
    servidor();
    render(<App />);

    expect(await screen.findByRole('link', { name: 'Nuevo proyecto' })).toHaveAttribute('href', '#/proyectos/nuevo');
    expect(screen.getByRole('link', { name: 'Editar proyecto' })).toHaveAttribute('href', '#/proyectos/1/editar');
    expect(screen.getByRole('link', { name: 'Nuevo evento' })).toHaveAttribute('href', '#/proyectos/1/eventos/nuevo');
  });
});

describe('formulario de proyecto', () => {
  it('crea un proyecto: valida, envía el cuerpo correcto y vuelve a la lista', async () => {
    const { llamadas } = servidor();
    ir('#/proyectos/nuevo');
    render(<App />);

    await userEvent.type(await screen.findByLabelText('Título'), '  Huerta comunitaria ');
    await userEvent.type(screen.getByLabelText('Área temática'), 'emprendimiento');
    await userEvent.type(screen.getByLabelText('Unidad vecinal'), 'UV-5');
    fireEvent.change(screen.getByLabelText('Fecha de inicio'), { target: { value: '2026-09-01' } });
    await userEvent.click(screen.getByRole('button', { name: 'Guardar proyecto' }));

    await waitFor(() => expect(llamadasDe(llamadas, 'POST')).toHaveLength(1));
    expect(llamadasDe(llamadas, 'POST')[0].cuerpo).toEqual(proyectoEntrada);
    await waitFor(() => expect(window.location.hash).toBe('#/'));
  });

  it('con campos obligatorios vacíos avisa y NO llama al servidor', async () => {
    const { llamadas } = servidor();
    ir('#/proyectos/nuevo');
    render(<App />);

    await userEvent.click(await screen.findByRole('button', { name: 'Guardar proyecto' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Escribe el título del proyecto.');
    expect(llamadasDe(llamadas, 'POST')).toHaveLength(0);
  });

  it('una fecha de término anterior a la de inicio se rechaza antes de enviar', async () => {
    const { llamadas } = servidor();
    ir('#/proyectos/nuevo');
    render(<App />);

    await userEvent.type(await screen.findByLabelText('Título'), 'X');
    await userEvent.type(screen.getByLabelText('Área temática'), 'a');
    await userEvent.type(screen.getByLabelText('Unidad vecinal'), 'b');
    fireEvent.change(screen.getByLabelText('Fecha de inicio'), { target: { value: '2026-12-01' } });
    fireEvent.change(screen.getByLabelText('Fecha de término (opcional)'), { target: { value: '2026-09-01' } });
    await userEvent.click(screen.getByRole('button', { name: 'Guardar proyecto' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('anterior a la de inicio');
    expect(llamadasDe(llamadas, 'POST')).toHaveLength(0);
  });

  it('editar: rellena el formulario con el proyecto y envía un PUT', async () => {
    const { llamadas } = servidor();
    ir('#/proyectos/1/editar');
    render(<App />);

    const titulo = await screen.findByLabelText('Título');
    expect(titulo).toHaveValue('Alfabetización digital');
    expect(screen.getByLabelText('Estado')).toHaveValue('EN_CURSO');
    await userEvent.clear(titulo);
    await userEvent.type(titulo, 'Alfabetización 2.0');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar proyecto' }));

    await waitFor(() => expect(llamadasDe(llamadas, 'PUT')).toHaveLength(1));
    expect(llamadasDe(llamadas, 'PUT')[0].url).toBe(`${API_BASE_URL}/api/proyectos/1`);
    expect(llamadasDe(llamadas, 'PUT')[0].cuerpo).toMatchObject({ titulo: 'Alfabetización 2.0', estado: 'EN_CURSO' });
  });

  it('eliminar pide confirmación y un 409 del servidor se muestra tal cual, sin cerrar el formulario', async () => {
    const { llamadas } = servidor((l) =>
      l.metodo === 'DELETE'
        ? json({ error: 'CONFLICT', mensaje: 'El proyecto tiene eventos; elimínalos primero', status: 409 }, 409)
        : undefined,
    );
    ir('#/proyectos/1/editar');
    render(<App />);

    await userEvent.click(await screen.findByRole('button', { name: 'Eliminar proyecto' }));
    expect(llamadasDe(llamadas, 'DELETE')).toHaveLength(0);
    await userEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('El proyecto tiene eventos; elimínalos primero');
    expect(screen.getByLabelText('Título')).toBeInTheDocument();
    expect(window.location.hash).toBe('#/proyectos/1/editar');
  });

  it('eliminar un proyecto vacío vuelve a la lista', async () => {
    const { llamadas } = servidor();
    ir('#/proyectos/1/editar');
    render(<App />);

    await userEvent.click(await screen.findByRole('button', { name: 'Eliminar proyecto' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }));

    await waitFor(() => expect(llamadasDe(llamadas, 'DELETE')).toHaveLength(1));
    await waitFor(() => expect(window.location.hash).toBe('#/'));
  });

  it('un proyecto que no existe lo dice en lugar de mostrar un formulario vacío', async () => {
    servidor();
    ir('#/proyectos/999/editar');
    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent('El proyecto no existe.');
  });
});

describe('formulario de evento', () => {
  it('crea un evento desde un proyecto: viene preseleccionado, convierte la hora a UTC y usa el radio por defecto', async () => {
    const { llamadas } = servidor();
    ir('#/proyectos/1/eventos/nuevo');
    render(<App />);

    expect(await screen.findByLabelText('Proyecto')).toHaveValue('1');
    await userEvent.type(screen.getByLabelText('Nombre del evento'), 'Taller de compostaje');
    fireEvent.change(screen.getByLabelText('Fecha y hora'), { target: { value: '2026-11-20T15:00' } });
    await userEvent.type(screen.getByLabelText('Cupos máximos (opcional)'), '25');
    await userEvent.type(screen.getByLabelText('Latitud'), '-33,45');
    await userEvent.type(screen.getByLabelText('Longitud'), '-70.66');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar evento' }));

    await waitFor(() => expect(llamadasDe(llamadas, 'POST')).toHaveLength(1));
    expect(llamadasDe(llamadas, 'POST')[0].url).toBe(`${API_BASE_URL}/api/eventos`);
    expect(llamadasDe(llamadas, 'POST')[0].cuerpo).toEqual({
      proyectoId: 1,
      nombre: 'Taller de compostaje',
      fechaHoraProgramada: new Date('2026-11-20T15:00').toISOString(),
      cuposMaximos: 25,
      quorumMinimo: null,
      recinto: null,
      latitud: -33.45,
      longitud: -70.66,
      radioMetros: 200,
    });
    await waitFor(() => expect(window.location.hash).toBe('#/'));
  });

  it.each([
    ['solo la latitud', '-33.45', '', 'juntas'],
    ['una latitud fuera de rango', '95', '-70', 'entre -90 y 90'],
    ['coordenadas que no son números', 'abc', '-70', 'deben ser números'],
  ])('rechaza %s antes de enviar', async (_caso, lat, lon, mensaje) => {
    const { llamadas } = servidor();
    ir('#/proyectos/1/eventos/nuevo');
    render(<App />);

    await userEvent.type(await screen.findByLabelText('Nombre del evento'), 'Taller');
    fireEvent.change(screen.getByLabelText('Fecha y hora'), { target: { value: '2026-11-20T15:00' } });
    if (lat) await userEvent.type(screen.getByLabelText('Latitud'), lat);
    if (lon) await userEvent.type(screen.getByLabelText('Longitud'), lon);
    await userEvent.click(screen.getByRole('button', { name: 'Guardar evento' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(mensaje);
    expect(llamadasDe(llamadas, 'POST')).toHaveLength(0);
  });

  it('cupos en cero y radio inválido se rechazan', async () => {
    servidor();
    ir('#/proyectos/1/eventos/nuevo');
    render(<App />);

    await userEvent.type(await screen.findByLabelText('Nombre del evento'), 'Taller');
    fireEvent.change(screen.getByLabelText('Fecha y hora'), { target: { value: '2026-11-20T15:00' } });
    await userEvent.type(screen.getByLabelText('Cupos máximos (opcional)'), '0');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar evento' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('cupos deben ser un número entero mayor que 0');

    await userEvent.clear(screen.getByLabelText('Cupos máximos (opcional)'));
    await userEvent.clear(screen.getByLabelText('Radio (metros)'));
    await userEvent.type(screen.getByLabelText('Radio (metros)'), '-5');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar evento' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('radio debe ser un número entero');
  });

  it('editar: rellena el evento, incluida la hora local, y envía un PUT', async () => {
    const { llamadas } = servidor();
    ir('#/eventos/12/editar');
    render(<App />);

    expect(await screen.findByLabelText('Nombre del evento')).toHaveValue('Taller de correo electrónico');
    expect(screen.getByLabelText('Cupos máximos (opcional)')).toHaveValue('30');
    expect(screen.getByLabelText('Latitud')).toHaveValue('-33.5121');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar evento' }));

    await waitFor(() => expect(llamadasDe(llamadas, 'PUT')).toHaveLength(1));
    expect(llamadasDe(llamadas, 'PUT')[0].url).toBe(`${API_BASE_URL}/api/eventos/12`);
    // La hora sobrevive al ida y vuelta por el formulario sin correrse.
    expect(llamadasDe(llamadas, 'PUT')[0].cuerpo).toMatchObject({
      proyectoId: 1,
      fechaHoraProgramada: '2026-10-28T15:00:00.000Z',
      radioMetros: 200,
    });
  });

  it('eliminar un evento con asistencias muestra el 409 del servidor', async () => {
    servidor((l) =>
      l.metodo === 'DELETE'
        ? json({ error: 'CONFLICT', mensaje: 'El evento ya tiene asistencias registradas y no se puede eliminar', status: 409 }, 409)
        : undefined,
    );
    ir('#/eventos/12/editar');
    render(<App />);

    await userEvent.click(await screen.findByRole('button', { name: 'Eliminar evento' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('ya tiene asistencias registradas');
    expect(window.location.hash).toBe('#/eventos/12/editar');
  });

  it('sin ningún proyecto explica que primero hay que crear uno', async () => {
    servidor((l) =>
      l.url.endsWith('/api/sync/catalogo') ? json(sobre({ servidorEn: 'x', proyectos: [], eventos: [], asistentes: [] })) : undefined,
    );
    ir('#/proyectos/1/eventos/nuevo');
    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Primero crea un proyecto');
  });

  it('una dirección con un id inválido es "página no encontrada"', async () => {
    servidor();
    ir('#/eventos/abc/editar');
    render(<App />);

    expect(await screen.findByText('Página no encontrada')).toBeInTheDocument();
  });
});

describe('descarga del reporte CSV', () => {
  afterEach(() => vi.restoreAllMocks());

  const filas = [
    {
      codigo: 'TER-9F1C7E62AAAA',
      tipo: 'VECINO',
      estadoInscripcion: 'SIN_INSCRIPCION',
      marcadoEn: '2026-10-28T15:04:11Z',
      estadoValidacion: 'FUERA_DE_RADIO',
      distanciaMetros: 8200,
      satisfaccion: null,
      utilidad: null,
    },
  ];

  it('pide las asistencias, arma el CSV y lo descarga con el nombre del evento', async () => {
    servidor((l) => (l.url.endsWith('/api/eventos/12/asistencias') ? json(sobre(filas)) : undefined));
    const crear = vi.fn(() => 'blob:falso');
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: crear, revokeObjectURL: vi.fn() }));
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    ir('#/eventos/12');
    render(<App />);

    await userEvent.click(await screen.findByRole('button', { name: 'Descargar CSV' }));

    await waitFor(() => expect(clic).toHaveBeenCalledTimes(1));
    const texto = await (crear.mock.calls[0] as unknown as [Blob])[0].text();
    expect(texto).toContain('TER-9F1C7E62AAAA;Vecino;Sin inscripción;2026-10-28T15:04:11Z;Fuera del radio;8200;;');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('si el servidor falla muestra el error y no descarga nada', async () => {
    servidor((l) =>
      l.url.endsWith('/api/eventos/12/asistencias') ? json({ error: 'FORBIDDEN', mensaje: 'Sin permiso', status: 403 }, 403) : undefined,
    );
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    ir('#/eventos/12');
    render(<App />);

    await userEvent.click(await screen.findByRole('button', { name: 'Descargar CSV' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(clic).not.toHaveBeenCalled();
  });

  it('la pantalla del evento enlaza a su edición', async () => {
    servidor();
    ir('#/eventos/12');
    render(<App />);

    expect(await screen.findByRole('link', { name: 'Editar evento' })).toHaveAttribute('href', '#/eventos/12/editar');
  });
});
