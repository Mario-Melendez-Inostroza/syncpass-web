import { useMemo } from 'react';
import { create } from 'qrcode';

const MARGEN = 2; // módulos en blanco alrededor, que el lector necesita para encontrar el código

/** Dibuja el QR como SVG a partir de la matriz de módulos: sin canvas ni HTML inyectado. */
export function CodigoQrSvg({ texto, etiqueta, className = 'h-32 w-32' }: { texto: string; etiqueta: string; className?: string }) {
  const { tamano, ruta } = useMemo(() => {
    const { modules } = create(texto, { errorCorrectionLevel: 'M' });
    const partes: string[] = [];
    for (let fila = 0; fila < modules.size; fila++) {
      for (let col = 0; col < modules.size; col++) {
        if (modules.get(fila, col)) partes.push(`M${col + MARGEN} ${fila + MARGEN}h1v1h-1z`);
      }
    }
    return { tamano: modules.size + MARGEN * 2, ruta: partes.join('') };
  }, [texto]);

  return (
    <svg
      role="img"
      aria-label={etiqueta}
      viewBox={`0 0 ${tamano} ${tamano}`}
      shapeRendering="crispEdges"
      className={`${className} bg-white`}
    >
      <path d={ruta} fill="#000" />
    </svg>
  );
}
