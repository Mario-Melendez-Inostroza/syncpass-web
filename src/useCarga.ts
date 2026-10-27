import { useCallback, useEffect, useRef, useState } from 'react';

interface Estado<T> {
  datos: T | null;
  error: Error | null;
  cargando: boolean;
  actualizadoEn: Date | null;
}

/**
 * Carga datos al montar y, si se indica [cadaMs], los vuelve a pedir periódicamente (monitoreo en vivo).
 *
 * - Si una actualización falla, SE CONSERVAN los últimos datos buenos y se informa el error: un corte de red
 *   momentáneo no debe vaciar un panel que se está mirando.
 * - Una respuesta atrasada nunca pisa a una más reciente, ni se aplica tras desmontar la pantalla.
 *
 * Para cargar otra cosa (otro evento) se monta el componente con una `key` distinta.
 */
export function useCarga<T>(cargar: () => Promise<T>, opciones: { cadaMs?: number | null } = {}) {
  const { cadaMs = null } = opciones;
  // La primera carga ya parte con cargando=true; el indicador solo se enciende en las recargas posteriores.
  const [estado, setEstado] = useState<Estado<T>>({
    datos: null,
    error: null,
    cargando: true,
    actualizadoEn: null,
  });
  const funcion = useRef(cargar);
  const numeroDeSolicitud = useRef(0);

  useEffect(() => {
    funcion.current = cargar;
  });

  const invalidar = useCallback(() => {
    numeroDeSolicitud.current++;
  }, []);

  const ejecutar = useCallback(async (conIndicador: boolean) => {
    const mia = ++numeroDeSolicitud.current;
    if (conIndicador) setEstado((e) => ({ ...e, cargando: true }));
    try {
      const datos = await funcion.current();
      if (mia === numeroDeSolicitud.current) {
        setEstado({ datos, error: null, cargando: false, actualizadoEn: new Date() });
      }
    } catch (error) {
      if (mia === numeroDeSolicitud.current) {
        setEstado((e) => ({
          ...e,
          error: error instanceof Error ? error : new Error(String(error)),
          cargando: false,
        }));
      }
    }
  }, []);

  const recargar = useCallback(() => ejecutar(true), [ejecutar]);

  useEffect(() => {
    void ejecutar(false);
    return invalidar;
  }, [ejecutar, invalidar]);

  useEffect(() => {
    if (!cadaMs) return;
    const temporizador = setInterval(() => void ejecutar(true), cadaMs);
    return () => clearInterval(temporizador);
  }, [cadaMs, ejecutar]);

  return { ...estado, recargar };
}
