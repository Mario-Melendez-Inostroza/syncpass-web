/** Fechas y números legibles en español de Chile, en la zona horaria del navegador (el servidor guarda UTC). */

const FECHA_HORA = new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' });
const SOLO_FECHA = new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' });
const HORA = new Intl.DateTimeFormat('es-CL', { timeStyle: 'medium' });

function aFecha(valor: string | null | undefined): Date | null {
  if (!valor) return null;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

export function fechaHora(iso: string | null | undefined): string {
  const fecha = aFecha(iso);
  return fecha ? FECHA_HORA.format(fecha) : '—';
}

/** Fecha sin hora ("2026-08-01"); se interpreta a mediodía local para que la zona horaria no corra el día. */
export function soloFecha(iso: string | null | undefined): string {
  if (!iso) return '—';
  const fecha = aFecha(`${iso}T12:00:00`);
  return fecha ? SOLO_FECHA.format(fecha) : '—';
}

export function hora(fecha: Date | null): string {
  return fecha ? HORA.format(fecha) : '—';
}

export function decimal(valor: number | null | undefined): string {
  return valor == null
    ? '—'
    : valor.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/** Porcentaje entero de [parte] sobre [total]; 0 si el total es 0. */
export function porcentaje(parte: number, total: number): number {
  return total > 0 ? Math.round((parte / total) * 100) : 0;
}
