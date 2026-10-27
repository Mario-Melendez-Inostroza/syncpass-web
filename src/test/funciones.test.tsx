import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import {
  actualizarAsistente,
  crearAsistentes,
  eliminarAsistente,
  obtenerAsistentes,
  obtenerComentarios,
  obtenerInforme,
} from '../api/endpoints';
import type { AsistenteFila, Informe, Proyecto } from '../api/tipos';
import { sesion } from '../auth/sesion';
import { API_BASE_URL } from '../config';
import { informeACsv } from '../csv';
import { catalogoDePrueba, json, jwtDePrueba, resumenDePrueba, simularFetch, sobre, type LlamadaFetch } from './ayudas';

const ir = (hash: string) => {
  window.location.hash = hash;
};

beforeEach(() => {
  ir('#/');
  sesion.guardar({
    accessToken: 'acceso-1',
    idToken: jwtDePrueba({ nombre: 'Docente Demo' }),
    refreshToken: 'refresh-1',
    email: 'docente.demo@example.com',
  });
});

const asistentes: AsistenteFila[] = [
  { id: 1, codigo: 'INS-000001', tipo: 'ESTUDIANTE', estadoInscripcion: 'INSCRITO', totalAsistencias: 2, creadoEnTerreno: false },
  { id: 2, codigo: 'INS-000002', tipo: 'VECINO', estadoInscripcion: 'INSCRITO', totalAsistencias: 0, creadoEnTerreno: false },
  { id: 3, codigo: 'TER-9F1C7E62AAAA', tipo: 'VECINO', estadoInscripcion: 'SIN_INSCRIPCION', totalAsistencias: 1, creadoEnTerreno: true },
];

const proyectoBase: Proyecto = { ...catalogoDePrueba.proyectos[0], estado: 'EN_CURSO' };

const informe: Informe = {
  generadoEn: '2026-10-28T18:00:00Z',
  totales: {
    eventos: 2,
    eventosConQuorumMinimo: 1,
    eventosQuorumCumplido: 1,
    totalMarcados: 30,
    asistentesUnicos: 25,
    encuestasRecibidas: 20,
    tasaRespuesta: 0.667,
    satisfaccionPromedio: 4.3,
    utilidadPromedio: 4.0,
  },
  proyectos: [
    {
      proyecto: { ...proyectoBase, id: 1, titulo: 'Alfabetización digital' },
      totales: {
        eventos: 2,
        eventosConQuorumMinimo: 1,
        eventosQuorumCumplido: 1,
        totalMarcados: 30,
        asistentesUnicos: 25,
        encuestasRecibidas: 20,
        tasaRespuesta: 0.667,
        satisfaccionPromedio: 4.3,
        utilidadPromedio: 4.0,
      },
      eventos: [
        {
          eventoId: 12,
          nombre: 'Taller de correo electrónico',
          fechaHoraProgramada: '2026-10-28T15:00:00Z',
          cuposMaximos: 30,
          quorumMinimo: 20,
          quorumCumplido: true,
          totalMarcados: 22,
          validas: 20,
          fueraDeRadio: 1,
          sinUbicacion: 1,
          encuestasRecibidas: 18,
          tasaRespuesta: 0.818,
          satisfaccionPromedio: 4.4,
          utilidadPromedio: 4.1,
          comentarios: [{ satisfaccion: 5, utilidad: 4, comentario: 'Muy claro; =SUMA(1)', enviadaEn: '2026-10-28T16:00:00Z' }],
        },
        {
          eventoId: 13,
          nombre: 'Taller de seguridad en línea',
          fechaHoraProgramada: '2026-11-05T15:00:00Z',
          cuposMaximos: null,
          quorumMinimo: null,
          quorumCumplido: null,
          totalMarcados: 8,
          validas: 8,
          fueraDeRadio: 0,
          sinUbicacion: 0,
          encuestasRecibidas: 2,
          tasaRespuesta: 0.25,
          satisfaccionPromedio: 3.5,
          utilidadPromedio: 3.0,
          comentarios: [],
        },
      ],
    },
    {
      proyecto: { ...proyectoBase, id: 2, titulo: 'Huerta comunitaria' },
      totales: {
        eventos: 0,
        eventosConQuorumMinimo: 0,
        eventosQuorumCumplido: 0,
        totalMarcados: 0,
        asistentesUnicos: 0,
        encuestasRecibidas: 0,
        tasaRespuesta: null,
        satisfaccionPromedio: null,
        utilidadPromedio: null,
      },
      eventos: [],
    },
  ],
};

/** Servidor falso con lo que usan estas pantallas; cada prueba puede sobrescribir una ruta. */
function servidor(sobrescribir: (l: LlamadaFetch) => Response | undefined = () => undefined) {
  return simularFetch((l) => {
    const propia = sobrescribir(l);
    if (propia) return propia;
    if (l.url.endsWith('/api/sync/catalogo')) return json(sobre(catalogoDePrueba));
    if (/\/api\/eventos\/12\/resumen$/.test(l.url)) return json(sobre(resumenDePrueba));
    if (/\/api\/eventos\/12\/comentarios$/.test(l.url)) return json(sobre([]));
    if (l.url.includes('/api/informes')) return json(sobre(informe));
    if (l.url.endsWith('/api/asistentes') && l.metodo === 'GET') return json(sobre(asistentes));
    if (l.url.endsWith('/api/asistentes') && l.metodo === 'POST') return json(sobre([{ ...asistentes[1], id: 9, codigo: 'INS-000009' }]), 201);
    if (/\/api\/asistentes\/\d+$/.test(l.url) && l.metodo === 'PUT') return json(sobre(asistentes[0]));
    if (/\/api\/asistentes\/\d+$/.test(l.url) && l.metodo === 'DELETE') return json(sobre(null));
    return new Response(null, { status: 404 });
  });
}

const llamadasDe = (llamadas: LlamadaFetch[], metodo: string) => llamadas.filter((l) => l.metodo === metodo);

describe('endpoints nuevos', () => {
  it('asistentes: URL, método y cuerpo de cada operación', async () => {
    const { llamadas } = servidor();

    await obtenerAsistentes();
    await crearAsistentes({ tipo: 'VECINO', estadoInscripcion: 'INSCRITO', cantidad: 3 });
    await actualizarAsistente(7, { tipo: 'DOCENTE', estadoInscripcion: 'SIN_INSCRIPCION' });
    await eliminarAsistente(7);

    expect(llamadas.map((l) => `${l.metodo} ${l.url.replace(API_BASE_URL, '')}`)).toEqual([
      'GET /api/asistentes',
      'POST /api/asistentes',
      'PUT /api/asistentes/7',
      'DELETE /api/asistentes/7',
    ]);
    expect(llamadas[1].cuerpo).toEqual({ tipo: 'VECINO', estadoInscripcion: 'INSCRITO', cantidad: 3 });
    expect(llamadas[2].cuerpo).toEqual({ tipo: 'DOCENTE', estadoInscripcion: 'SIN_INSCRIPCION' });
  });

  it('informe y comentarios: URL, con y sin proyecto', async () => {
    const { llamadas } = servidor();
    await obtenerInforme();
    await obtenerInforme(2);
    await obtenerComentarios(12);

    expect(llamadas.map((l) => l.url.replace(API_BASE_URL, ''))).toEqual([
      '/api/informes',
      '/api/informes?proyectoId=2',
      '/api/eventos/12/comentarios',
    ]);
  });
});

describe('quórum mínimo en el evento', () => {
  it('muestra cuántos faltan cuando aún no se cumple', async () => {
    servidor();
    ir('#/eventos/12');
    render(<App />);

    expect(await screen.findByText('Faltan 2 para el quórum')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Avance hacia el quórum mínimo' })).toHaveAttribute('aria-valuenow', '18');
  });

  it('indica que se cumplió', async () => {
    servidor((l) =>
      /\/resumen$/.test(l.url) ? json(sobre({ ...resumenDePrueba, totalMarcados: 25, quorumCumplido: true })) : undefined,
    );
    ir('#/eventos/12');
    render(<App />);

    expect(await screen.findByText('Quórum cumplido')).toBeInTheDocument();
  });

  it('si el evento no define mínimo lo dice y ofrece editarlo, sin dar un veredicto', async () => {
    servidor((l) =>
      /\/resumen$/.test(l.url) ? json(sobre({ ...resumenDePrueba, quorumMinimo: null, quorumCumplido: null })) : undefined,
    );
    ir('#/eventos/12');
    render(<App />);

    expect(await screen.findByText(/no define un quórum mínimo/)).toBeInTheDocument();
    expect(screen.queryByText('Quórum cumplido')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'editar el evento' })).toHaveAttribute('href', '#/eventos/12/editar');
  });

  it('el formulario envía el mínimo y rechaza uno mayor que los cupos o no entero', async () => {
    const { llamadas } = servidor((l) => (l.metodo === 'POST' ? json(sobre({ id: 99 }), 201) : undefined));
    ir('#/proyectos/1/eventos/nuevo');
    render(<App />);

    await userEvent.type(await screen.findByLabelText('Nombre del evento'), 'Taller');
    fireEvent.change(screen.getByLabelText('Fecha y hora'), { target: { value: '2026-11-20T15:00' } });
    await userEvent.type(screen.getByLabelText('Cupos máximos (opcional)'), '25');

    await userEvent.type(screen.getByLabelText('Quórum mínimo (opcional)'), '30');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar evento' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('El quórum mínimo no puede superar los cupos máximos.');

    await userEvent.clear(screen.getByLabelText('Quórum mínimo (opcional)'));
    await userEvent.type(screen.getByLabelText('Quórum mínimo (opcional)'), '0');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar evento' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('El quórum mínimo debe ser un número entero mayor que 0.');
    expect(llamadasDe(llamadas, 'POST')).toHaveLength(0);

    await userEvent.clear(screen.getByLabelText('Quórum mínimo (opcional)'));
    await userEvent.type(screen.getByLabelText('Quórum mínimo (opcional)'), '15');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar evento' }));
    await waitFor(() => expect(llamadasDe(llamadas, 'POST')).toHaveLength(1));
    expect(llamadasDe(llamadas, 'POST')[0].cuerpo).toMatchObject({ cuposMaximos: 25, quorumMinimo: 15 });
  });
});

describe('comentarios del evento', () => {
  it('lista los comentarios sin ningún dato de quién los escribió', async () => {
    servidor((l) =>
      /\/comentarios$/.test(l.url)
        ? json(sobre([{ satisfaccion: 5, utilidad: 4, comentario: 'Aprendí mucho', enviadaEn: '2026-10-28T16:00:00Z' }]))
        : undefined,
    );
    ir('#/eventos/12');
    render(<App />);

    expect(await screen.findByText('Aprendí mucho')).toBeInTheDocument();
    expect(screen.getByText(/Satisfacción 5\/5 · Utilidad 4\/5/)).toBeInTheDocument();
  });

  it('sin comentarios lo dice', async () => {
    servidor();
    ir('#/eventos/12');
    render(<App />);

    expect(await screen.findByText('Todavía no hay comentarios.')).toBeInTheDocument();
  });
});

describe('menú del panel', () => {
  it('tiene Eventos, Asistentes e Informes y marca la sección activa', async () => {
    servidor();
    ir('#/asistentes');
    render(<App />);

    const menu = await screen.findByRole('navigation', { name: 'Panel' });
    expect(within(menu).getAllByRole('link').map((a) => a.textContent)).toEqual(['Eventos', 'Asistentes', 'Informes']);
    expect(within(menu).getByRole('link', { name: 'Asistentes' })).toHaveAttribute('aria-current', 'page');
    expect(within(menu).getByRole('link', { name: 'Eventos' })).not.toHaveAttribute('aria-current');
  });
});

describe('pantalla de asistentes', () => {
  it('lista a los asistentes con sus cifras y marca a los creados en terreno', async () => {
    servidor();
    ir('#/asistentes');
    render(<App />);

    const tabla = await screen.findByRole('table', { name: 'Lista de asistentes' });
    expect(within(tabla).getAllByRole('row')).toHaveLength(4); // cabecera + 3
    expect(within(tabla).getByText('TER-9F1C7E62AAAA').closest('tr')).toHaveTextContent('En terreno');
    expect(screen.getByText('Creados en terreno').previousElementSibling).toHaveTextContent('1');
  });

  it('filtra por código, tipo e inscripción', async () => {
    servidor();
    ir('#/asistentes');
    render(<App />);
    const tabla = await screen.findByRole('table', { name: 'Lista de asistentes' });

    await userEvent.selectOptions(screen.getByLabelText('Filtrar por tipo'), 'VECINO');
    expect(within(tabla).getAllByRole('row')).toHaveLength(3);

    await userEvent.selectOptions(screen.getByLabelText('Filtrar por inscripción'), 'SIN_INSCRIPCION');
    expect(within(tabla).getAllByRole('row')).toHaveLength(2);
    expect(within(tabla).getByText('TER-9F1C7E62AAAA')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Buscar por código'), 'INS-');
    expect(screen.getByText('Ningún asistente coincide con los filtros.')).toBeInTheDocument();
  });

  it('agrega inscritos en lote y recarga la lista', async () => {
    const { llamadas } = servidor();
    ir('#/asistentes');
    render(<App />);
    await screen.findByRole('table', { name: 'Lista de asistentes' });

    await userEvent.selectOptions(screen.getByLabelText('Tipo'), 'ESTUDIANTE');
    await userEvent.clear(screen.getByLabelText('Cantidad'));
    await userEvent.type(screen.getByLabelText('Cantidad'), '5');
    await userEvent.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(await screen.findByRole('status')).toHaveTextContent('INS-000009');
    expect(llamadasDe(llamadas, 'POST')[0].cuerpo).toEqual({ tipo: 'ESTUDIANTE', estadoInscripcion: 'INSCRITO', cantidad: 5 });
    expect(llamadasDe(llamadas, 'GET').filter((l) => l.url.endsWith('/api/asistentes'))).toHaveLength(2);
  });

  it.each(['0', '201', 'abc', '2,5'])('rechaza la cantidad %s sin llamar al servidor', async (cantidad) => {
    const { llamadas } = servidor();
    ir('#/asistentes');
    render(<App />);
    await screen.findByRole('table', { name: 'Lista de asistentes' });

    await userEvent.clear(screen.getByLabelText('Cantidad'));
    await userEvent.type(screen.getByLabelText('Cantidad'), cantidad);
    await userEvent.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('entre 1 y 200');
    expect(llamadasDe(llamadas, 'POST')).toHaveLength(0);
  });

  it('edita el tipo y la inscripción de un asistente', async () => {
    const { llamadas } = servidor();
    ir('#/asistentes');
    render(<App />);
    await screen.findByRole('table', { name: 'Lista de asistentes' });

    await userEvent.click(screen.getByRole('button', { name: 'Editar INS-000002' }));
    await userEvent.selectOptions(screen.getByLabelText('Tipo de INS-000002'), 'DOCENTE');
    await userEvent.selectOptions(screen.getByLabelText('Inscripción de INS-000002'), 'SIN_INSCRIPCION');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(llamadasDe(llamadas, 'PUT')).toHaveLength(1));
    expect(llamadasDe(llamadas, 'PUT')[0].url).toBe(`${API_BASE_URL}/api/asistentes/2`);
    expect(llamadasDe(llamadas, 'PUT')[0].cuerpo).toEqual({ tipo: 'DOCENTE', estadoInscripcion: 'SIN_INSCRIPCION' });
    expect(await screen.findByRole('status')).toHaveTextContent('Se actualizó INS-000002.');
  });

  it('eliminar pide confirmación y un "No" no borra nada', async () => {
    const { llamadas } = servidor();
    ir('#/asistentes');
    render(<App />);
    await screen.findByRole('table', { name: 'Lista de asistentes' });

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar INS-000002' }));
    expect(screen.getByText('¿Eliminar INS-000002?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'No' }));
    expect(llamadasDe(llamadas, 'DELETE')).toHaveLength(0);

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar INS-000002' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }));
    await waitFor(() => expect(llamadasDe(llamadas, 'DELETE')).toHaveLength(1));
    expect(llamadasDe(llamadas, 'DELETE')[0].url).toBe(`${API_BASE_URL}/api/asistentes/2`);
  });

  it('un 409 (tiene asistencias) se muestra con el mensaje del servidor', async () => {
    servidor((l) =>
      l.metodo === 'DELETE'
        ? json({ error: 'CONFLICT', mensaje: 'El asistente tiene asistencias registradas', status: 409 }, 409)
        : undefined,
    );
    ir('#/asistentes');
    render(<App />);
    await screen.findByRole('table', { name: 'Lista de asistentes' });

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar INS-000001' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('El asistente tiene asistencias registradas');
    expect(screen.queryByText('¿Eliminar INS-000001?')).not.toBeInTheDocument();
  });

  it('sin asistentes lo explica', async () => {
    servidor((l) => (l.url.endsWith('/api/asistentes') && l.metodo === 'GET' ? json(sobre([])) : undefined));
    ir('#/asistentes');
    render(<App />);

    expect(await screen.findByText(/Todavía no hay asistentes/)).toBeInTheDocument();
  });
});

describe('credenciales QR', () => {
  it('genera un QR por asistente inscrito con el formato que lee la app', async () => {
    servidor();
    ir('#/asistentes/credenciales');
    render(<App />);

    expect(await screen.findByRole('img', { name: 'Código QR de INS-000001' })).toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength(2); // solo inscritos por defecto
    expect(screen.queryByRole('img', { name: /TER-/ })).not.toBeInTheDocument();
    // El dibujo no es vacío: tiene módulos negros.
    expect(screen.getByRole('img', { name: 'Código QR de INS-000001' }).querySelector('path')?.getAttribute('d')).toMatch(/^M\d+ \d+h1v1h-1z/);
  });

  it('el QR cambia con el asistente y se pueden incluir los sin inscripción', async () => {
    servidor();
    ir('#/asistentes/credenciales');
    render(<App />);
    const primero = (await screen.findByRole('img', { name: 'Código QR de INS-000001' })).innerHTML;
    const segundo = screen.getByRole('img', { name: 'Código QR de INS-000002' }).innerHTML;
    expect(primero).not.toBe(segundo);

    await userEvent.click(screen.getByLabelText('Solo inscritos'));
    expect(screen.getAllByRole('img')).toHaveLength(3);
    await userEvent.selectOptions(screen.getByLabelText('Tipo'), 'ESTUDIANTE');
    expect(screen.getAllByRole('img')).toHaveLength(1);
  });

  it('imprime con el botón y no deja imprimir si no hay credenciales', async () => {
    servidor((l) => (l.url.endsWith('/api/asistentes') ? json(sobre([])) : undefined));
    const imprimir = vi.spyOn(window, 'print').mockImplementation(() => {});
    ir('#/asistentes/credenciales');
    render(<App />);

    expect(await screen.findByText(/No hay asistentes con esos filtros/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Imprimir' })).toBeDisabled();
    expect(imprimir).not.toHaveBeenCalled();
    imprimir.mockRestore();
  });
});

describe('informes de impacto', () => {
  afterEach(() => vi.restoreAllMocks());

  it('muestra los totales generales y cada proyecto con sus eventos', async () => {
    servidor();
    ir('#/informes');
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Todos los proyectos' })).toBeInTheDocument();
    expect(screen.getByText('Asistentes únicos').previousElementSibling).toHaveTextContent('25');
    expect(screen.getByText('Quórum mínimo cumplido').previousElementSibling).toHaveTextContent('1 de 1');
    const tabla = screen.getByRole('table', { name: 'Eventos de Alfabetización digital' });
    expect(within(tabla).getByText('Cumplido (20)')).toBeInTheDocument();
    expect(within(tabla).getByText('Sin mínimo')).toBeInTheDocument();
    expect(screen.getByText('Este proyecto todavía no tiene eventos.')).toBeInTheDocument();
    expect(screen.getByText(/Muy claro/)).toBeInTheDocument();
  });

  it('al elegir un proyecto muestra solo ese y sus propios totales', async () => {
    servidor();
    ir('#/informes');
    render(<App />);
    await screen.findByRole('heading', { name: 'Todos los proyectos' });

    await userEvent.selectOptions(screen.getByLabelText('Proyecto'), '2');

    expect(screen.getAllByRole('heading', { name: 'Huerta comunitaria', level: 2 })).toHaveLength(2); // título del informe y de la sección
    expect(screen.queryByRole('table', { name: 'Eventos de Alfabetización digital' })).not.toBeInTheDocument();
    expect(screen.getByText('Asistentes únicos').previousElementSibling).toHaveTextContent('0');
  });

  it('descarga el CSV con una fila por evento y los decimales con coma', async () => {
    servidor();
    const crear = vi.fn(() => 'blob:falso');
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: crear, revokeObjectURL: vi.fn() }));
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    ir('#/informes');
    render(<App />);

    await userEvent.click(await screen.findByRole('button', { name: 'Descargar CSV' }));

    expect(clic).toHaveBeenCalledTimes(1);
    const texto = await (crear.mock.calls[0] as unknown as [Blob])[0].text();
    const lineas = texto.replace('﻿', '').trim().split('\r\n');
    expect(lineas).toHaveLength(3); // encabezado + 2 eventos
    expect(lineas[1]).toContain('Alfabetización digital;Taller de correo electrónico;2026-10-28T15:00:00Z;30;20;Cumplido;22;20;1;1;18;81,8;4,4;4,1;1');
  });

  it('imprime con el botón', async () => {
    servidor();
    const imprimir = vi.spyOn(window, 'print').mockImplementation(() => {});
    ir('#/informes');
    render(<App />);

    await userEvent.click(await screen.findByRole('button', { name: 'Imprimir / guardar PDF' }));
    expect(imprimir).toHaveBeenCalledTimes(1);
  });

  it('si el servidor falla muestra el error con reintento', async () => {
    servidor((l) => (l.url.endsWith('/api/informes') ? json({ error: 'FORBIDDEN', mensaje: 'Sin permiso', status: 403 }, 403) : undefined));
    ir('#/informes');
    render(<App />);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });
});

describe('informeACsv', () => {
  it('lleva BOM, separador ; y CRLF, y las celdas vacías quedan vacías', () => {
    const texto = informeACsv(informe);
    expect(texto.startsWith('﻿Proyecto;Evento;')).toBe(true);
    expect(texto).toContain('\r\n');
    const fila = texto.split('\r\n')[2];
    expect(fila).toContain('Alfabetización digital;Taller de seguridad en línea;2026-11-05T15:00:00Z;;;Sin mínimo definido;8;8;0;0;2;25;3,5;3;0');
  });

  it('un proyecto sin eventos no aporta filas', () => {
    expect(informeACsv({ ...informe, proyectos: [informe.proyectos[1]] }).trim().split('\r\n')).toHaveLength(1);
  });
});
