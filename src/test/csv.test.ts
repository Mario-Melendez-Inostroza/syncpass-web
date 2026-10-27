import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AsistenciaFila } from '../api/tipos';
import { aCsv, asistenciasACsv, descargarCsv } from '../csv';
import { aInputLocal, deInputLocal, numeroOpcional, textoOpcional } from '../formulario';

const fila = (extra: Partial<AsistenciaFila> = {}): AsistenciaFila => ({
  codigo: 'ASI-0001',
  tipo: 'VECINO',
  estadoInscripcion: 'INSCRITO',
  marcadoEn: '2026-10-28T15:04:11Z',
  estadoValidacion: 'VALIDA',
  distanciaMetros: 37,
  satisfaccion: 5,
  utilidad: 4,
  ...extra,
});

describe('aCsv', () => {
  it('empieza con BOM (Excel respeta las tildes), separa con ; y cierra cada línea con CRLF', () => {
    const csv = aCsv(['Código', 'Tipo'], [['ASI-0001', 'Vecino']]);

    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv).toBe('﻿Código;Tipo\r\nASI-0001;Vecino\r\n');
  });

  it('null y undefined quedan como celda vacía; los números se escriben tal cual', () => {
    expect(aCsv(['a', 'b', 'c'], [[null, undefined, 0]])).toBe('﻿a;b;c\r\n;;0\r\n');
  });

  it('una celda con ; comillas o salto de línea va entre comillas y las comillas se duplican', () => {
    const csv = aCsv(['x'], [['a;b'], ['dice "hola"'], ['dos\nlíneas']]);

    expect(csv).toBe('﻿x\r\n"a;b"\r\n"dice ""hola"""\r\n"dos\nlíneas"\r\n');
  });

  it('neutraliza las fórmulas: un texto que empieza por = + - @ no se ejecuta en Excel', () => {
    const csv = aCsv(['x'], [['=1+1'], ['+cmd'], ['-2+3'], ['@SUMA(A1)'], ['normal']]);

    expect(csv).toContain("\r\n'=1+1\r\n");
    expect(csv).toContain("\r\n'+cmd\r\n");
    expect(csv).toContain("\r\n'-2+3\r\n");
    expect(csv).toContain("\r\n'@SUMA(A1)\r\n");
    expect(csv).toContain('\r\nnormal\r\n');
  });

  it('un número negativo NO se neutraliza: es un dato, no una fórmula', () => {
    expect(aCsv(['x'], [[-5]])).toBe('﻿x\r\n-5\r\n');
  });
});

describe('asistenciasACsv', () => {
  it('escribe los encabezados del reporte y una fila legible por asistencia', () => {
    const csv = asistenciasACsv([fila()]);
    const [encabezado, datos] = csv.slice(1).split('\r\n');

    expect(encabezado).toBe(
      'Código;Tipo;Inscripción;Marcado en (UTC);Ubicación;Distancia (m);Satisfacción (1-5);Utilidad (1-5)',
    );
    expect(datos).toBe('ASI-0001;Vecino;Inscrito;2026-10-28T15:04:11Z;Dentro del radio;37;5;4');
  });

  it('traduce tipo, inscripción y ubicación; sin encuesta ni distancia deja las celdas vacías', () => {
    const csv = asistenciasACsv([
      fila({
        codigo: 'TER-9F1C7E62AAAA',
        tipo: 'ESTUDIANTE',
        estadoInscripcion: 'SIN_INSCRIPCION',
        estadoValidacion: 'FUERA_DE_RADIO',
        distanciaMetros: null,
        satisfaccion: null,
        utilidad: null,
      }),
    ]);

    expect(csv).toContain('TER-9F1C7E62AAAA;Estudiante;Sin inscripción;2026-10-28T15:04:11Z;Fuera del radio;;;\r\n');
  });

  it('un evento sin asistencias da solo los encabezados', () => {
    expect(asistenciasACsv([]).slice(1).split('\r\n').filter(Boolean)).toHaveLength(1);
  });

  it('no incluye datos que identifiquen: ni quién registró ni coordenadas ni comentarios', () => {
    const csv = asistenciasACsv([fila()]).toLowerCase();

    expect(csv).not.toContain('latitud');
    expect(csv).not.toContain('comentario');
    expect(csv).not.toContain('registr');
  });
});

describe('descargarCsv', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('crea un archivo text/csv con el nombre pedido, lo descarga y libera la URL', async () => {
    const crear = vi.fn((_blob: Blob) => 'blob:falso');
    const liberar = vi.fn();
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: crear, revokeObjectURL: liberar }));
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe('asistencia-evento-12.csv');
      expect(this.href).toContain('blob:falso');
    });

    descargarCsv('asistencia-evento-12.csv', 'hola');

    expect(clic).toHaveBeenCalledTimes(1);
    const blob = crear.mock.calls[0][0];
    expect(blob.type).toBe('text/csv;charset=utf-8');
    expect(await blob.text()).toBe('hola');
    expect(liberar).toHaveBeenCalledWith('blob:falso');
    expect(document.querySelector('a[download]')).toBeNull();
    clic.mockRestore();
  });
});

describe('ayudas de formulario', () => {
  it('aInputLocal y deInputLocal son inversas (a la precisión de minutos), sea cual sea la zona horaria', () => {
    const iso = '2026-11-20T15:30:00.000Z';

    expect(deInputLocal(aInputLocal(iso))).toBe(iso);
  });

  it('deInputLocal interpreta el valor en la hora local y lo pasa a ISO UTC', () => {
    expect(deInputLocal('2026-11-20T15:00')).toBe(new Date('2026-11-20T15:00').toISOString());
  });

  it('vacío o ilegible no es una fecha', () => {
    expect(aInputLocal(null)).toBe('');
    expect(aInputLocal('no-es-fecha')).toBe('');
    expect(deInputLocal('')).toBeNull();
  });

  it('numeroOpcional: vacío es null, acepta coma decimal y distingue lo mal escrito con NaN', () => {
    expect(numeroOpcional('')).toBeNull();
    expect(numeroOpcional('  ')).toBeNull();
    expect(numeroOpcional('-33,45')).toBe(-33.45);
    expect(numeroOpcional('200')).toBe(200);
    expect(numeroOpcional('abc')).toBeNaN();
    expect(numeroOpcional('1e3')).toBeNaN();
  });

  it('textoOpcional: quita espacios y el vacío pasa a null', () => {
    expect(textoOpcional('  hola ')).toBe('hola');
    expect(textoOpcional('   ')).toBeNull();
  });
});
