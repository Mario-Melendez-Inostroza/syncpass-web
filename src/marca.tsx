import logoCabecera from './assets/logo-cabecera.png';

/**
 * Logo de SyncPass (imagen de la marca, solo el nombre). `normal` es el de las cabeceras; `grande` el de las tarjetas de ingreso.
 * En modo oscuro va sobre una pastilla blanca, porque el logo está pensado para fondo claro.
 */
export function Logo({ tamano = 'normal' }: { tamano?: 'normal' | 'pequeno' | 'grande' }) {
  const alto = tamano === 'normal' ? 'h-9 sm:h-11' : tamano === 'pequeno' ? 'h-8' : 'h-16';
  return (
    <img
      src={logoCabecera}
      alt="SyncPass"
      className={`${alto} w-auto dark:rounded-lg dark:bg-white dark:px-2`}
      draggable={false}
    />
  );
}
