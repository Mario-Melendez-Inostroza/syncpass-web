import type { AsistenciaFila, Informe } from './api/tipos';

/**
 * Reporte de asistencia en CSV (caso §2.4: reportes automáticos).
 *
 * - Separador `;`: con la configuración regional de Chile, Excel abre un CSV con `,` en una sola columna.
 * - BOM al inicio: sin él Excel lee el archivo como ANSI y rompe las tildes.
 * - Saltos de línea CRLF, que es lo que esperan Excel y el estándar CSV.
 */

const SEPARADOR = ';';
const SALTO = '\r\n';
const BOM = '﻿';

export type Celda = string | number | null | undefined;

/**
 * Una celda de texto que empieza por `=`, `+`, `-` o `@` la interpreta como fórmula Excel o Calc (inyección de
 * fórmulas). Se antepone una comilla simple para que sea texto. Los números reales no se tocan.
 */
function neutralizar(texto: string): string {
  return /^[=+\-@\t\r]/.test(texto) ? `'${texto}` : texto;
}

function celda(valor: Celda): string {
  if (valor === null || valor === undefined) return '';
  const texto = typeof valor === 'number' ? String(valor) : neutralizar(valor);
  return /[;"\r\n]/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto;
}

/** Arma el texto CSV (con BOM) a partir de los encabezados y las filas. */
export function aCsv(encabezados: string[], filas: Celda[][]): string {
  const lineas = [encabezados, ...filas].map((fila) => fila.map(celda).join(SEPARADOR));
  return BOM + lineas.join(SALTO) + SALTO;
}

const TIPOS: Record<AsistenciaFila['tipo'], string> = {
  ESTUDIANTE: 'Estudiante',
  VECINO: 'Vecino',
  DOCENTE: 'Docente',
};

const INSCRIPCION: Record<AsistenciaFila['estadoInscripcion'], string> = {
  INSCRITO: 'Inscrito',
  SIN_INSCRIPCION: 'Sin inscripción',
};

const VALIDACION: Record<AsistenciaFila['estadoValidacion'], string> = {
  VALIDA: 'Dentro del radio',
  FUERA_DE_RADIO: 'Fuera del radio',
  SIN_UBICACION: 'Sin ubicación',
};

const ENCABEZADOS = [
  'Código',
  'Tipo',
  'Inscripción',
  'Marcado en (UTC)',
  'Ubicación',
  'Distancia (m)',
  'Satisfacción (1-5)',
  'Utilidad (1-5)',
];

/** CSV de las asistencias de un evento. La hora va en ISO UTC: no depende de la zona horaria de quien abra el archivo. */
export function asistenciasACsv(filas: AsistenciaFila[]): string {
  return aCsv(
    ENCABEZADOS,
    filas.map((f) => [
      f.codigo,
      TIPOS[f.tipo] ?? f.tipo,
      INSCRIPCION[f.estadoInscripcion] ?? f.estadoInscripcion,
      f.marcadoEn,
      VALIDACION[f.estadoValidacion] ?? f.estadoValidacion,
      f.distanciaMetros,
      f.satisfaccion,
      f.utilidad,
    ]),
  );
}

const ENCABEZADOS_INFORME = [
  'Proyecto',
  'Evento',
  'Fecha programada (UTC)',
  'Cupos máximos',
  'Quórum mínimo',
  'Quórum',
  'Asistentes marcados',
  'Dentro del radio',
  'Fuera del radio',
  'Sin ubicación',
  'Encuestas recibidas',
  'Tasa de respuesta (%)',
  'Satisfacción promedio (1-5)',
  'Utilidad promedio (1-5)',
  'Comentarios',
];

/** Decimal con coma: con la configuración regional de Chile, Excel no reconoce "4.4" como número. */
const conComa = (n: number | null): string | null => (n === null ? null : String(n).replace('.', ','));

function textoQuorum(minimo: number | null, cumplido: boolean | null): string {
  if (minimo === null) return 'Sin mínimo definido';
  return cumplido ? 'Cumplido' : 'No cumplido';
}

/** CSV del informe de impacto: una fila por evento, con el proyecto al que pertenece. */
export function informeACsv(informe: Informe): string {
  return aCsv(
    ENCABEZADOS_INFORME,
    informe.proyectos.flatMap((p) =>
      p.eventos.map((e) => [
        p.proyecto.titulo,
        e.nombre,
        e.fechaHoraProgramada,
        e.cuposMaximos,
        e.quorumMinimo,
        textoQuorum(e.quorumMinimo, e.quorumCumplido),
        e.totalMarcados,
        e.validas,
        e.fueraDeRadio,
        e.sinUbicacion,
        e.encuestasRecibidas,
        conComa(e.tasaRespuesta === null ? null : Math.round(e.tasaRespuesta * 1000) / 10),
        conComa(e.satisfaccionPromedio),
        conComa(e.utilidadPromedio),
        e.comentarios.length,
      ]),
    ),
  );
}

/** Descarga [texto] como archivo en el navegador. */
export function descargarCsv(nombre: string, texto: string): void {
  const url = URL.createObjectURL(new Blob([texto], { type: 'text/csv;charset=utf-8' }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}
