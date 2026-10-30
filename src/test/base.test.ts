import { describe, expect, it } from 'vitest';
import { decodificarPayload, esCoordinador, esMonitor, usuarioDe } from '../auth/jwt';
import { normalizarBaseUrl } from '../config';
import { decimal, porcentaje, soloFecha } from '../formato';
import { jwtDePrueba } from './ayudas';

describe('normalizarBaseUrl', () => {
  it('sin valor usa el backend local', () => {
    expect(normalizarBaseUrl(undefined)).toBe('http://localhost:8080');
    expect(normalizarBaseUrl('   ')).toBe('http://localhost:8080');
  });

  it('quita el sufijo /api que llevaba el .env original, para no duplicar la ruta', () => {
    expect(normalizarBaseUrl('http://localhost:8080/api')).toBe('http://localhost:8080');
    expect(normalizarBaseUrl('http://localhost:8080/api/')).toBe('http://localhost:8080');
  });

  it('quita barras finales y espacios', () => {
    expect(normalizarBaseUrl('  https://abc.execute-api.us-east-1.amazonaws.com/  ')).toBe(
      'https://abc.execute-api.us-east-1.amazonaws.com',
    );
  });

  it('no toca un host que solo contiene "api" en el nombre', () => {
    expect(normalizarBaseUrl('https://api.ejemplo.cl')).toBe('https://api.ejemplo.cl');
  });
});

describe('jwt', () => {
  it('lee sub, email, nombre y grupos del id token', () => {
    const u = usuarioDe(jwtDePrueba({ grupos: ['COORDINADOR'] }))!;
    expect(u).toEqual({
      sub: 'sub-1',
      email: 'docente.demo@example.com',
      nombre: 'Docente Demo',
      grupos: ['COORDINADOR'],
    });
  });

  it('decodifica nombres con tildes y eñes como UTF-8', () => {
    expect(usuarioDe(jwtDePrueba({ nombre: 'Ñandú Pérez' }))!.nombre).toBe('Ñandú Pérez');
  });

  it('el rol no distingue mayúsculas y un usuario puede tener los dos grupos', () => {
    const u = usuarioDe(jwtDePrueba({ grupos: ['coordinador', 'MONITOR'] }))!;
    expect(esCoordinador(u)).toBe(true);
    expect(esMonitor(u)).toBe(true);
  });

  it('los grupos de otros proyectos no dan rol', () => {
    const u = usuarioDe(jwtDePrueba({ grupos: ['USER', 'profesor', 'Administrador'] }))!;
    expect(esCoordinador(u)).toBe(false);
    expect(esMonitor(u)).toBe(false);
  });

  it('sin el claim de grupos no hay rol', () => {
    const u = usuarioDe(jwtDePrueba({ grupos: null }))!;
    expect(u.grupos).toEqual([]);
    expect(esCoordinador(u)).toBe(false);
  });

  it('un texto que no es un JWT da null en lugar de romper', () => {
    for (const basura of [undefined, null, '', 'undefined', 'a.b', 'a.%%%.c', 'a.bnVsbA.c']) {
      expect(usuarioDe(basura)).toBeNull();
    }
    expect(decodificarPayload('a.WzFd.c')).toBeNull(); // el payload es un arreglo, no un objeto
  });
});

describe('formato', () => {
  it('decimal usa coma y un decimal', () => {
    expect(decimal(4.4)).toBe('4,4');
    expect(decimal(null)).toBe('—');
  });

  it('porcentaje redondea y tolera total 0', () => {
    expect(porcentaje(16, 18)).toBe(89);
    expect(porcentaje(5, 0)).toBe(0);
  });

  it('soloFecha no corre el día por la zona horaria', () => {
    expect(soloFecha('2026-08-01')).toContain('1');
    expect(soloFecha(null)).toBe('—');
  });
});
