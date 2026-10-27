import { useState } from 'react';
import { cancelarInscripcion, inscribirseEnTaller, obtenerMiPerfil, obtenerMisTalleres } from '../api/endpoints';
import type { Taller } from '../api/tipos';
import { CLASE_BOTON_PELIGRO, CLASE_BOTON_PRIMARIO, Cargando, ErrorCaja, Tarjeta } from '../componentes';
import { fechaHora } from '../formato';
import { CodigoQrSvg } from '../qr';
import { contenidoQr } from '../qrTexto';
import { useCarga } from '../useCarga';

const TIPOS = { ESTUDIANTE: 'Estudiante', VECINO: 'Vecino', DOCENTE: 'Docente' } as const;

function TarjetaTaller({ t, onCambio }: { t: Taller; onCambio: () => void }) {
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sinCupos = t.cuposDisponibles !== null && t.cuposDisponibles <= 0 && !t.inscrito;

  async function cambiar() {
    setError(null);
    setTrabajando(true);
    try {
      if (t.inscrito) await cancelarInscripcion(t.id);
      else await inscribirseEnTaller(t.id);
      onCambio();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo completar la acción.');
    } finally {
      setTrabajando(false);
    }
  }

  return (
    <Tarjeta className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t.nombre}</h2>
          <p className="text-sm text-slate-500">{t.proyecto}</p>
        </div>
        {t.inscrito && (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Inscrito</span>
        )}
      </div>
      <p className="text-sm text-slate-600">
        {fechaHora(t.fechaHoraProgramada)}
        {t.recinto ? ` · ${t.recinto}` : ''}
      </p>
      <p className="text-sm text-slate-600">
        {t.cuposDisponibles === null
          ? 'Sin límite de cupos'
          : sinCupos
            ? 'Sin cupos disponibles'
            : `${t.cuposDisponibles} cupo${t.cuposDisponibles === 1 ? '' : 's'} disponible${t.cuposDisponibles === 1 ? '' : 's'}`}
      </p>
      {error && (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      )}
      <div>
        <button
          type="button"
          onClick={() => void cambiar()}
          disabled={trabajando || sinCupos}
          className={t.inscrito ? CLASE_BOTON_PELIGRO : CLASE_BOTON_PRIMARIO}
        >
          {trabajando ? 'Un momento…' : t.inscrito ? 'Cancelar inscripción' : 'Inscribirme'}
        </button>
      </div>
    </Tarjeta>
  );
}

/** Los talleres próximos: el asistente ve cuántos cupos quedan y se inscribe (caso §3.1). */
export function TalleresPagina() {
  const { datos, error, cargando, recargar } = useCarga(obtenerMisTalleres);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Talleres</h1>
        <p className="text-sm text-slate-500">Elige a cuáles quieres ir. El día del taller muestra tu código QR en la entrada.</p>
      </div>
      {error && <ErrorCaja error={error} onReintentar={() => void recargar()} />}
      {cargando && !datos && <Cargando texto="Cargando talleres…" />}
      {datos && datos.length === 0 && <p className="text-sm text-slate-500">Todavía no hay talleres próximos.</p>}
      {datos && (
        <div className="grid gap-4 md:grid-cols-2">
          {datos.map((t) => (
            <TarjetaTaller key={t.id} t={t} onCambio={() => void recargar()} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Mi credencial: el QR que escanea el monitor al llegar. Solo el código sintético, ningún dato personal. */
export function MiCredencialPagina() {
  const { datos, error, cargando, recargar } = useCarga(obtenerMiPerfil);

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-5 text-center">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi credencial</h1>
        <p className="text-sm text-slate-500">Muéstrasela al monitor al llegar al taller.</p>
      </div>
      {error && <ErrorCaja error={error} onReintentar={() => void recargar()} />}
      {cargando && !datos && <Cargando texto="Cargando tu credencial…" />}
      {datos && (
        <Tarjeta className="flex flex-col items-center gap-3">
          <CodigoQrSvg texto={contenidoQr(datos.id)} etiqueta={`Mi código QR ${datos.codigo}`} className="h-56 w-56" />
          <p className="font-mono text-xl font-bold">{datos.codigo}</p>
          <p className="text-sm text-slate-500">{TIPOS[datos.tipo]} · SyncPass</p>
        </Tarjeta>
      )}
    </div>
  );
}
