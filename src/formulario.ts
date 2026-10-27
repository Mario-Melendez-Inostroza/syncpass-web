/** Conversiones y validaciones puras de los formularios de proyecto y evento. */

const dosDigitos = (n: number) => String(n).padStart(2, '0');

/** ISO UTC del servidor -> valor de `<input type="datetime-local">` en la hora local del navegador. */
export function aInputLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  return (
    `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}` +
    `T${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`
  );
}

/** Valor de `datetime-local` (hora local) -> ISO UTC para el servidor. null si está vacío o es ilegible. */
export function deInputLocal(valor: string): string | null {
  if (!valor) return null;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString();
}

/**
 * Número opcional de un campo de texto. '' -> null. Acepta coma decimal (es-CL). Un texto que no es número
 * devuelve NaN, para que el formulario pueda distinguir "vacío" de "mal escrito".
 */
export function numeroOpcional(texto: string): number | null {
  const limpio = texto.trim().replace(',', '.');
  if (limpio === '') return null;
  return /^-?\d+(\.\d+)?$/.test(limpio) ? Number(limpio) : Number.NaN;
}

/** Texto opcional: espacios fuera, y vacío pasa a null. */
export function textoOpcional(texto: string): string | null {
  const limpio = texto.trim();
  return limpio === '' ? null : limpio;
}
