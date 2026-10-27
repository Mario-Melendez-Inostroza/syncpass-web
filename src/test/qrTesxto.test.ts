import { describe, expect, it } from 'vitest';
import { contenidoQr } from '../qrTexto';

describe('contenidoQr', () => {
  it('usa el formato ASISTENTE_{id} que lee la app del monitor', () => {
    expect(contenidoQr(7)).toBe('ASISTENTE_7');
    expect(contenidoQr(340)).toBe('ASISTENTE_340');
  });

  it('no mete espacios ni datos personales: solo el prefijo y el número', () => {
    expect(contenidoQr(12)).toMatch(/^ASISTENTE_\d+$/);
  });
});