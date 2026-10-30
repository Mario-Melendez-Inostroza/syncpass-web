import { describe, expect, it } from 'vitest';
import { fechaHora, hora, soloFecha } from '../formato';

describe('formato de fechas y horas', () => {
  it('sin valor muestran un guion largo', () => {
    expect(fechaHora(null)).toBe('—');
    expect(fechaHora(undefined)).toBe('—');
    expect(soloFecha(null)).toBe('—');
    expect(hora(null)).toBe('—');
  });

  it('un texto que no es fecha no rompe la pantalla', () => {
    expect(fechaHora('no-es-fecha')).toBe('—');
  });

  it('una fecha ISO válida se muestra con el año', () => {
    expect(fechaHora('2026-10-28T15:00:00Z')).toContain('2026');
  });
});