import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { obtenerAsistentes } from '../api/endpoints';
import type { AsistenteFila } from '../api/tipos';
import { CodigoQrSvg } from '../qr';
import { contenidoQr } from '../qrTexto';
import { Campo, CLASE_BOTON_PRIMARIO, CLASE_BOTON_SECUNDARIO, CLASE_CAMPO, Cargando, ErrorCaja } from '../componentes';
import { useCarga } from '../useCarga';

const TIPOS: Record<AsistenteFila['tipo'], string> = { ESTUDIANTE: 'Estudiante', VECINO: 'Vecino', DOCENTE: 'Docente' };

/**
 * Credenciales con QR para imprimir (caso §2.2: el monitor "escanea el QR del participante"). Cada una lleva solo el
 * código sintético y el tipo: ningún dato personal (caso §5.1).
 */
export function CredencialesPagina() {
  const { datos, error, cargando, recargar } = useCarga(obtenerAsistentes);
  const [tipo, setTipo] = useState<'' | AsistenteFila['tipo']>('');
  const [soloInscritos, setSoloInscritos] = useState(true);

  const lista = useMemo(
    () => (datos ?? []).filter((a) => (!tipo || a.tipo === tipo) && (!soloInscritos || a.estadoInscripcion === 'INSCRITO')),
    [datos, tipo, soloInscritos],
  );

  return (
    <div className="flex flex-col gap-5">
      <Link href="/asistentes" className="inline-flex min-h-11 items-center text-sm font-medium text-blue-600 print:hidden dark:text-blue-400">
        ← Volver a los asistentes
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Credenciales QR</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Imprímelas y entrégalas a cada persona: el monitor las escanea con la app para marcar la asistencia.
          </p>
        </div>
        <button type="button" onClick={() => window.print()} disabled={lista.length === 0} className={CLASE_BOTON_PRIMARIO}>
          Imprimir
        </button>
      </div>

      {error && <ErrorCaja error={error} onReintentar={() => void recargar()} />}
      {cargando && !datos && <Cargando texto="Cargando asistentes…" />}

      {datos && (
        <>
          <div className="grid gap-4 sm:grid-cols-[12rem_auto] sm:items-end print:hidden">
            <Campo etiqueta="Tipo">
              <select className={CLASE_CAMPO} value={tipo} onChange={(e) => setTipo(e.target.value as '' | AsistenteFila['tipo'])}>
                <option value="">Todos</option>
                {Object.entries(TIPOS).map(([valor, etiqueta]) => (
                  <option key={valor} value={valor}>{etiqueta}</option>
                ))}
              </select>
            </Campo>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={soloInscritos}
                onChange={(e) => setSoloInscritos(e.target.checked)}
                className="h-5 w-5 accent-blue-600"
              />
              Solo inscritos
            </label>
          </div>

          <p className="text-sm text-zinc-500 print:hidden dark:text-zinc-400">
            {lista.length === 1 ? '1 credencial' : `${lista.length} credenciales`}
          </p>

          {lista.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No hay asistentes con esos filtros.{' '}
              <Link href="/asistentes" className={`${CLASE_BOTON_SECUNDARIO} inline-flex items-center`}>
                Agregar asistentes
              </Link>
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 print:grid-cols-3 print:gap-3">
              {lista.map((a) => (
                <li
                  key={a.id}
                  className="flex break-inside-avoid flex-col items-center gap-2 rounded-2xl border border-zinc-300 bg-white p-4 text-center text-zinc-900 dark:border-zinc-700 print:rounded-none print:border-black"
                >
                  <CodigoQrSvg texto={contenidoQr(a.id)} etiqueta={`Código QR de ${a.codigo}`} />
                  <p className="font-mono text-lg font-bold">{a.codigo}</p>
                  <p className="text-xs text-zinc-600">{TIPOS[a.tipo]} · SyncPass</p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
