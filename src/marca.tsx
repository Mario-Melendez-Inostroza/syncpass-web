import logoCabecera from './assets/logo-cabecera.png';
import logoCompleto from './assets/logo-completo.png';

/**
 * Logo de SyncPass (imagen de la marca). `normal` es el de las cabeceras, sin lema; `grande` lleva el lema
 * "Gestión que genera impacto". En modo oscuro va sobre una pastilla blanca, porque el logo está pensado para fondo claro.
 */
export function Logo({ tamano = 'normal' }: { tamano?: 'normal' | 'pequeno' | 'grande' }) {
  const grande = tamano === 'grande';
  const alto = tamano === 'normal' ? 'h-12 sm:h-[68px]' : tamano === 'pequeno' ? 'h-9' : 'h-24';
  return (
    <img
      src={grande ? logoCompleto : logoCabecera}
      alt="SyncPass"
      className={`${alto} w-auto dark:rounded-lg dark:bg-white dark:px-2`}
      draggable={false}
    />
  );
}
