import {
  ArrowRight,
  CalendarDays,
  ChartColumn,
  FolderOpen,
  GraduationCap,
  QrCode,
  ShieldCheck,
  Smartphone,
  Users,
  WifiOff,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Logo } from '../marca';

/**
 * Página de inicio pública de SyncPass: lo que ve quien aún no inició sesión. Con sesión, la raíz es el panel.
 *
 * Diseño: una sola idea por pantalla (qué es, qué ofrece, cómo contactar), sin imágenes pesadas: el fondo es CSS.
 * Todo el contenido es institucional y ficticio (caso §5.1).
 *
 * Las rutas viven en el hash (/#/ingresar), así que los enlaces internos NO pueden ser `href="#servicios"`:
 * cambiarían la ruta. Se desplaza con scrollIntoView.
 */

const SECCIONES = [
  { id: 'inicio', texto: 'Inicio' },
  { id: 'servicios', texto: 'Servicios' },
  { id: 'contacto', texto: 'Contacto' },
] as const;

type IdSeccion = (typeof SECCIONES)[number]['id'];

function irA(id: IdSeccion) {
  const destino = document.getElementById(id);
  if (id === 'inicio' || !destino) window.scrollTo?.({ top: 0, behavior: 'smooth' });
  else destino.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
}

/** Sección que se está viendo, para marcarla en el menú. Sin IntersectionObserver (pruebas) queda en "inicio". */
function useSeccionActiva(): IdSeccion {
  const [activa, setActiva] = useState<IdSeccion>('inicio');
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const visibles = new Map<string, number>();
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) visibles.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0);
        const mejor = [...visibles.entries()].sort((a, b) => b[1] - a[1])[0];
        if (mejor && mejor[1] > 0) setActiva(mejor[0] as IdSeccion);
      },
      { rootMargin: '-30% 0px -50% 0px', threshold: [0, 0.25, 0.5, 1] },
    );
    for (const { id } of SECCIONES) {
      const el = document.getElementById(id);
      if (el) observador.observe(el);
    }
    return () => observador.disconnect();
  }, []);
  return activa;
}

const BOTON_AZUL =
  'bg-gradient-to-b from-[#2487ff] to-[#0b5be0] shadow-[0_8px_28px_rgba(20,100,240,0.4)] hover:from-[#3a95ff] hover:to-[#1c6cf0]';

const TEXTO_DEGRADADO = 'bg-gradient-to-r from-[#2a8cff] via-[#13c3e3] to-[#18d7a6] bg-clip-text text-transparent';

// ------------------------------------------------------------------ cabecera

function Cabecera() {
  const activa = useSeccionActiva();
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#060d24]/95">
      <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/" aria-label="SyncPass, inicio" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Secciones" className="flex items-center gap-1 text-sm sm:gap-3">
          {SECCIONES.map(({ id, texto }) => (
            <button
              key={id}
              type="button"
              onClick={() => irA(id)}
              aria-current={activa === id ? 'true' : undefined}
              className={`min-h-11 rounded-lg px-3 font-medium transition-colors hover:text-white ${
                activa === id ? 'text-white' : 'text-slate-400'
              }`}
            >
              {texto}
            </button>
          ))}
        </nav>

        <Link
          href="/ingresar"
          className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-5 text-sm font-semibold text-white ${BOTON_AZUL}`}
        >
          Iniciar sesión <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </header>
  );
}

// ------------------------------------------------------------------ inicio

const PUNTOS = [
  { icono: QrCode, texto: 'Registro por QR' },
  { icono: WifiOff, texto: 'Funciona sin conexión' },
  { icono: ShieldCheck, texto: 'Datos 100 % ficticios' },
];

function Inicio() {
  return (
    <section id="inicio" className="relative isolate overflow-hidden">
      {/* Fondo solo con degradados: sin imágenes que cargar. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_55%_at_50%_0%,rgba(37,99,235,0.35),transparent_70%),radial-gradient(40%_40%_at_85%_30%,rgba(19,195,227,0.18),transparent_70%),radial-gradient(35%_40%_at_10%_45%,rgba(24,215,166,0.12),transparent_70%)]"
      />
      <div className="mx-auto max-w-4xl px-5 pb-24 pt-20 text-center sm:px-8 sm:pt-28">
        <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#2a5ca8]/70 bg-[#0e2a5c]/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#4b9dff]">
          <Users className="h-3.5 w-3.5" aria-hidden />
          Plataforma de gestión comunitaria
        </p>

        <h1 className="mt-8 text-[40px] font-bold leading-[1.05] tracking-tight sm:text-6xl">
          Proyectos que conectan.{' '}
          <span className={TEXTO_DEGRADADO}>Comunidades que avanzan.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
          SyncPass ayuda a coordinar proyectos comunitarios: se registra la asistencia en terreno con el celular, aunque
          no haya señal, y el equipo ve el quórum y la satisfacción al instante.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/ingresar"
            className={`inline-flex min-h-12 items-center gap-2 rounded-lg px-7 text-base font-semibold text-white ${BOTON_AZUL}`}
          >
            Iniciar sesión <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <button
            type="button"
            onClick={() => irA('servicios')}
            className="inline-flex min-h-12 items-center rounded-lg border border-white/25 px-7 text-base font-semibold text-white transition-colors hover:bg-white/10"
          >
            Ver servicios
          </button>
        </div>

        <ul className="mt-14 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm text-slate-300">
          {PUNTOS.map(({ icono: Icono, texto }) => (
            <li key={texto} className="flex items-center gap-2.5">
              <Icono className="h-5 w-5 text-[#2a8cff]" aria-hidden />
              {texto}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ servicios

const SERVICIOS = [
  {
    icono: FolderOpen,
    titulo: 'Gestión de proyectos',
    texto: 'Crea y edita proyectos y sus eventos: fechas, cupos, recinto y ubicación.',
    color: 'text-emerald-400',
    fondo: 'bg-emerald-400/15',
  },
  {
    icono: Smartphone,
    titulo: 'Registro en terreno',
    texto: 'La app Android marca la asistencia por QR o por lista, incluso sin señal, y la envía al volver la red.',
    color: 'text-sky-400',
    fondo: 'bg-sky-400/15',
  },
  {
    icono: CalendarDays,
    titulo: 'Quórum en vivo',
    texto: 'Mira cuántas personas asistieron, si marcaron dentro del radio del evento y cuántos cupos quedan.',
    color: 'text-violet-400',
    fondo: 'bg-violet-400/15',
  },
  {
    icono: ChartColumn,
    titulo: 'Encuestas y reportes',
    texto: 'Satisfacción y utilidad al terminar el evento, y un reporte descargable en CSV para Excel.',
    color: 'text-amber-400',
    fondo: 'bg-amber-400/15',
  },
];

/** Metas del caso DSY1105 (§2.4 y §4.1). Son OBJETIVOS del proyecto, no mediciones de SyncPass. */
const METAS = [
  { valor: '< 5 s', texto: 'por persona al registrar la asistencia', antes: 'antes, 45 s con planilla de papel' },
  { valor: '> 65 %', texto: 'de respuesta en las encuestas', antes: 'antes, 15 % por correo' },
  { valor: '-80 %', texto: 'de horas de digitación y consolidación', antes: 'antes, todo a mano' },
  { valor: '100 %', texto: 'operativa sin conexión en terreno', antes: 'antes, sin señal no se podía' },
];

function Servicios() {
  return (
    <section id="servicios" className="scroll-mt-16 border-t border-white/10">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Todo lo que necesitas en una sola plataforma</h2>
          <p className="mt-4 text-lg text-slate-300">
            Del plan del proyecto al informe de impacto, sin planillas de papel ni digitación.
          </p>
        </div>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2">
          {SERVICIOS.map(({ icono: Icono, titulo, texto, color, fondo }) => (
            <li
              key={titulo}
              className="flex gap-5 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-6"
            >
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${fondo}`}>
                <Icono className={`h-6 w-6 ${color}`} aria-hidden />
              </span>
              <div>
                <h3 className="text-lg font-semibold">{titulo}</h3>
                <p className="mt-1.5 leading-relaxed text-slate-400">{texto}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-16">
          <h3 className="text-center text-sm font-semibold uppercase tracking-wider text-[#4b9dff]">
            Lo que SyncPass se propone lograr
          </h3>
          <ul className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {METAS.map(({ valor, texto, antes }) => (
              <li key={valor} className="bg-[#0a1230] p-6">
                <p className={`text-4xl font-bold tracking-tight ${TEXTO_DEGRADADO}`}>{valor}</p>
                <p className="mt-2 text-slate-200">{texto}</p>
                <p className="mt-1 text-sm text-slate-500">{antes}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-center text-sm text-slate-500">
            Metas del caso DSY1105 (§2.4 y §4.1). Son objetivos del proyecto, todavía no mediciones.
          </p>
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ contacto

function Contacto() {
  return (
    <section id="contacto" className="scroll-mt-16 border-t border-white/10 bg-gradient-to-b from-transparent to-[#07122e]">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">¿Listo para conectar a tu comunidad?</h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-300">
              Los coordinadores ingresan desde esta web. Los monitores registran la asistencia desde la app Android con su
              cuenta de monitor.
            </p>
            <Link
              href="/ingresar"
              className={`mt-8 inline-flex min-h-12 items-center gap-2 rounded-lg px-7 text-base font-semibold text-white ${BOTON_AZUL}`}
            >
              Iniciar sesión <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <dl className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-start gap-4">
              <GraduationCap className="mt-0.5 h-6 w-6 shrink-0 text-[#2a8cff]" aria-hidden />
              <div>
                <dt className="font-semibold">Proyecto académico</dt>
                <dd className="mt-1 text-slate-400">DSY1105 · Desarrollo de Aplicaciones Móviles · Duoc UC, CITT Plaza Vespucio.</dd>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Users className="mt-0.5 h-6 w-6 shrink-0 text-[#2a8cff]" aria-hidden />
              <div>
                <dt className="font-semibold">¿Necesitas una cuenta?</dt>
                <dd className="mt-1 text-slate-400">Pídesela al equipo docente: las cuentas de coordinador y de monitor las crea el equipo.</dd>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-[#2a8cff]" aria-hidden />
              <div>
                <dt className="font-semibold">Datos de demostración</dt>
                <dd className="mt-1 text-slate-400">Todo lo que se muestra es ficticio: no hay datos personales reales.</dd>
              </div>
            </div>
          </dl>
        </div>
      </div>
      <footer className="border-t border-white/10 px-5 py-6 text-center text-xs text-slate-500">
        <Logo tamano="pequeno" />
        <p className="mt-3">SyncPass · MVP académico · Todos los datos son ficticios.</p>
      </footer>
    </section>
  );
}

// ------------------------------------------------------------------ página

export function InicioPagina() {
  return (
    <div className="min-h-screen bg-[#060d24] text-white [font-family:Inter,'Segoe_UI',system-ui,sans-serif]">
      <Cabecera />
      <main>
        <Inicio />
        <Servicios />
      </main>
      <Contacto />
    </div>
  );
}
