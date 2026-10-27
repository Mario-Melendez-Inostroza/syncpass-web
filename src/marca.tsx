import { Check } from 'lucide-react';

/**
 * Logo de SyncPass: un check dentro de un cuadrado azul y el nombre con "Pass" en azul. Hereda el color del texto
 * (`currentColor`) para "Sync", así sirve igual sobre la página de inicio oscura y sobre el panel claro u oscuro.
 */
export function Logo({ tamano = 'normal' }: { tamano?: 'normal' | 'pequeno' }) {
  const caja = tamano === 'normal' ? 'h-9 w-9 rounded-xl' : 'h-7 w-7 rounded-lg';
  const texto = tamano === 'normal' ? 'text-[26px]' : 'text-xl';
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className={`grid ${caja} place-items-center bg-gradient-to-b from-[#3a86ff] to-[#1450e6] shadow-[0_0_20px_rgba(37,99,235,0.45)]`}
      >
        <Check className="h-3/5 w-3/5 text-white" strokeWidth={3.5} aria-hidden />
      </span>
      <span className={`${texto} font-extrabold leading-none tracking-tight`}>
        Sync<span className="text-[#2a8cff]">Pass</span>
      </span>
    </span>
  );
}
