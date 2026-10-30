import {
  ArrowRight,
  Check,
  ChartColumn,
  ClipboardList,
  Database,
  FileSpreadsheet,
  FolderOpen,
  GraduationCap,
  MapPin,
  MessageSquareHeart,
  QrCode,
  ShieldCheck,
  Smartphone,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'wouter';
import fondoHero from '../assets/fondo-hero.webp';
import { Logo } from '../marca';

/**
 * Página de inicio pública de SyncPass: lo que ve quien aún no inició sesión. Con sesión, la raíz es el panel.
 *
 * Diseño fiel a la imagen de referencia: cabecera blanca con el logo, el menú y "Iniciar sesión"; debajo, el titular
 * sobre la imagen de fondo con ondas azules, y cuatro garantías en fila. Más abajo siguen las secciones de detalle.
 *
 * Las rutas viven en el hash (/#/ingresar), así que los enlaces internos NO pueden ser `href="#servicios"`:
 * cambiarían la ruta. Se desplaza con scrollIntoView.
 */

const SECCIONES = [
  { id: 'inicio', texto: 'Inicio' },
  { id: 'como-funciona', texto: 'Cómo funciona' },
  { id: 'contacto', texto: 'Contacto' },
] as const;

type IdSeccion = (typeof SECCIONES)[number]['id'];

function irA(id: IdSeccion | 'servicios') {
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

const BOTON_PRINCIPAL =
  'bg-[#0b63f6] text-white shadow-[0_12px_28px_-10px_rgba(11,99,246,0.65)] transition-colors hover:bg-[#0a54d1]';

const AZUL_OSCURO = 'text-[#0a1445]';
const TEXTO_DEGRADADO = 'bg-gradient-to-r from-[#0b63f6] to-[#1a9bff] bg-clip-text text-transparent';

// ------------------------------------------------------------------ cabecera

function Cabecera() {
  const activa = useSeccionActiva();
  return (
    <header className="sticky top-0 z-30 bg-white">
      <div className="mx-auto grid h-[72px] max-w-[1480px] grid-cols-[auto_1fr_auto] items-center gap-4 px-5 sm:h-[88px] sm:px-8">
        <Link href="/" aria-label="SyncPass, inicio" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Secciones" className="hidden items-center justify-center gap-6 text-[15px] sm:flex">
          {SECCIONES.map(({ id, texto }) => (
            <button
              key={id}
              type="button"
              onClick={() => irA(id)}
              aria-current={activa === id ? 'true' : undefined}
              className={`relative min-h-11 px-2 font-medium transition-colors sm:px-3 ${
                activa === id
                  ? `${AZUL_OSCURO} font-semibold after:absolute after:inset-x-1 after:bottom-1.5 after:h-[3px] after:rounded-full after:bg-[#0b63f6]`
                  : 'text-slate-700 hover:text-[#0b63f6]'
              }`}
            >
              {texto}
            </button>
          ))}
        </nav>

        <Link
          href="/ingresar"
          className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-[15px] font-semibold sm:min-h-[52px] sm:px-7 ${BOTON_PRINCIPAL}`}
        >
          Iniciar sesión <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </header>
  );
}

// ------------------------------------------------------------------ inicio

const GARANTIAS = [
  { icono: ShieldCheck, color: 'bg-emerald-100 text-emerald-600', texto: ['Registro rápido', 'y seguro'] },
  { icono: Wifi, color: 'bg-sky-100 text-[#0b63f6]', texto: ['Funciona offline', 'en terreno'] },
  { icono: ChartColumn, color: 'bg-violet-100 text-violet-600', texto: ['Reportes en', 'tiempo real'] },
  { icono: Database, color: 'bg-emerald-100 text-emerald-600', texto: ['Datos protegidos', 'y confiables'] },
];

function Inicio() {
  return (
    <section
      id="inicio"
      className="relative isolate overflow-hidden bg-[#f4f8ff] bg-cover bg-[60%_bottom] bg-no-repeat"
      style={{ backgroundImage: `url(${fondoHero})` }}
    >
      <div className="mx-auto max-w-[1480px] px-5 pb-16 pt-12 sm:px-8 sm:pt-16 lg:min-h-[calc(100vh-88px)] lg:pb-8 lg:pt-[4vh]">
        <div className="anim-aparecer max-w-[640px]">
          <p className="inline-flex items-center gap-2 rounded-full bg-[#dbe8ff]/80 px-4 py-2 text-[13px] font-bold uppercase tracking-wide text-[#0b63f6]">
            <ChartColumn className="h-4 w-4" aria-hidden />
            Gestión comunitaria inteligente
          </p>

          <h1
            className={`mt-[2.2vh] text-[2.6rem] font-extrabold leading-[1.04] tracking-[-0.03em] sm:text-6xl lg:text-[clamp(2.8rem,min(3.95vw,6.8vh),4.5rem)] ${AZUL_OSCURO}`}
          >
            Proyectos que <br className="hidden sm:block" />
            conectan.{' '}
            <span className={TEXTO_DEGRADADO}>
              Comunidades <br className="hidden sm:block" />
              que avanzan.
            </span>
          </h1>

          <p className="mt-6 max-w-[560px] text-lg leading-[1.45] text-[#1d2a55] sm:text-xl lg:max-w-[max(540px,37vw)] lg:text-[clamp(1.05rem,min(1.26vw,2.4vh),1.45rem)]">
            SyncPass es una plataforma integral para la gestión de proyectos comunitarios, registro de asistencias y
            evaluación de impacto social. Tecnología simple, segura y diseñada para generar un cambio real.
          </p>

          <Link
            href="/ingresar"
            className={`mt-8 inline-flex min-h-[56px] lg:mt-[2.5vh] items-center gap-2 rounded-2xl px-10 text-lg font-semibold ${BOTON_PRINCIPAL}`}
          >
            Iniciar sesión <ArrowRight className="h-5 w-5" aria-hidden />
          </Link>
        </div>

        <ul className="mt-10 grid max-w-[900px] lg:mt-[3vh] grid-cols-2 gap-x-6 gap-y-5 sm:flex sm:flex-wrap sm:gap-x-10 xl:flex-nowrap">
          {GARANTIAS.map(({ icono: Icono, color, texto }) => (
            <li key={texto[0]} className="flex items-center gap-3">
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${color}`}>
                <Icono className="h-6 w-6" aria-hidden />
              </span>
              <span className="text-[15px] font-medium leading-snug text-[#1d2a55]">
                {texto[0]}
                <br />
                {texto[1]}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ cómo funciona

const PASOS = [
  {
    numero: '1',
    icono: ClipboardList,
    titulo: 'Planifica',
    texto: 'El coordinador crea el proyecto y sus eventos desde la web: fecha, cupos, recinto y radio de ubicación.',
  },
  {
    numero: '2',
    icono: Smartphone,
    titulo: 'Registra',
    texto: 'El monitor marca la asistencia por QR o por lista, y da de alta a quien llega sin inscripción. Con o sin señal.',
  },
  {
    numero: '3',
    icono: ChartColumn,
    titulo: 'Mide',
    texto: 'El quórum se actualiza solo, los asistentes responden la encuesta al terminar y el reporte se descarga en un clic.',
  },
];

function ComoFunciona() {
  return (
    <section id="como-funciona" aria-labelledby="como-funciona-titulo" className="scroll-mt-16 bg-white">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Cómo funciona</p>
          <h2 id="como-funciona-titulo" className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Del plan al informe, en tres pasos
          </h2>
        </div>
        <ol className="mt-14 grid gap-8 md:grid-cols-3">
          {PASOS.map(({ numero, icono: Icono, titulo, texto }) => (
            <li key={numero} className="relative">
              <div className="flex items-center gap-4">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#0b63f6] to-[#1a9bff] text-white shadow-lg shadow-blue-500/30">
                  <Icono className="h-6 w-6" aria-hidden />
                </span>
                <span className="text-5xl font-extrabold text-slate-200" aria-hidden>
                  {numero}
                </span>
              </div>
              <h3 className="mt-5 text-xl font-bold text-slate-900">{titulo}</h3>
              <p className="mt-2 leading-relaxed text-slate-600">{texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ servicios (cuadrícula)

function Tarjeta({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <li className={`rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_1px_0_rgba(15,23,42,0.04),0_20px_40px_-28px_rgba(30,41,99,0.3)] ${className}`}>
      {children}
    </li>
  );
}

function Icono({ icono: I, color }: { icono: typeof Check; color: string }) {
  return (
    <span className={`grid h-12 w-12 place-items-center rounded-2xl ${color}`}>
      <I className="h-6 w-6" aria-hidden />
    </span>
  );
}

function Servicios() {
  return (
    <section id="servicios" className="scroll-mt-16 bg-[#f4f8ff]">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Servicios</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Todo lo que necesitas en una sola plataforma
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Pensada para el terreno: simple de usar con una mano y confiable cuando falla la señal.
          </p>
        </div>

        <ul className="mt-14 grid gap-5 md:grid-cols-6">
          <Tarjeta className="md:col-span-4">
            <Icono icono={WifiOff} color="bg-amber-50 text-amber-600" />
            <h3 className="mt-5 text-xl font-bold text-slate-900">Funciona sin conexión</h3>
            <p className="mt-2 max-w-md leading-relaxed text-slate-600">
              En las unidades vecinales sin cobertura la app sigue registrando. Todo queda guardado en el teléfono y viaja
              solo cuando vuelve la señal, sin perder nada y sin duplicar registros.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm font-medium">
              <span className="rounded-full bg-amber-50 px-4 py-2 text-amber-700">Sin señal</span>
              <ArrowRight className="h-4 w-4 text-slate-300" aria-hidden />
              <span className="rounded-full bg-blue-50 px-4 py-2 text-blue-700">Guardado en el teléfono</span>
              <ArrowRight className="h-4 w-4 text-slate-300" aria-hidden />
              <span className="rounded-full bg-emerald-50 px-4 py-2 text-emerald-700">Enviado</span>
            </div>
          </Tarjeta>

          <Tarjeta className="md:col-span-2">
            <Icono icono={QrCode} color="bg-blue-50 text-blue-600" />
            <h3 className="mt-5 text-xl font-bold text-slate-900">Registro por QR</h3>
            <p className="mt-2 leading-relaxed text-slate-600">Escanear una credencial toma segundos, sin filas ni firmas en papel.</p>
          </Tarjeta>

          <Tarjeta className="md:col-span-2">
            <Icono icono={Users} color="bg-violet-50 text-violet-600" />
            <h3 className="mt-5 text-xl font-bold text-slate-900">Quórum en vivo</h3>
            <p className="mt-2 leading-relaxed text-slate-600">Cuántas personas llegaron, cuántos cupos quedan y si marcaron dentro del radio.</p>
          </Tarjeta>

          <Tarjeta className="md:col-span-2">
            <Icono icono={MessageSquareHeart} color="bg-rose-50 text-rose-600" />
            <h3 className="mt-5 text-xl font-bold text-slate-900">Encuestas al instante</h3>
            <p className="mt-2 leading-relaxed text-slate-600">Satisfacción y utilidad al terminar el evento, cuando la experiencia está fresca.</p>
          </Tarjeta>

          <Tarjeta className="md:col-span-2">
            <Icono icono={FileSpreadsheet} color="bg-emerald-50 text-emerald-600" />
            <h3 className="mt-5 text-xl font-bold text-slate-900">Reportes en Excel</h3>
            <p className="mt-2 leading-relaxed text-slate-600">Descarga la asistencia de cada evento en CSV, lista para consolidar.</p>
          </Tarjeta>

          <Tarjeta className="md:col-span-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-5">
                <Icono icono={FolderOpen} color="bg-sky-50 text-sky-600" />
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Gestión de proyectos y eventos</h3>
                  <p className="mt-2 max-w-xl leading-relaxed text-slate-600">
                    Crea y edita proyectos, programa talleres con sus cupos y define dónde ocurren para validar la ubicación
                    de cada marcación.
                  </p>
                </div>
              </div>
              <ul className="flex flex-wrap gap-2 text-sm font-medium text-slate-700">
                {[
                  { icono: FolderOpen, texto: 'Proyectos' },
                  { icono: ClipboardList, texto: 'Eventos y cupos' },
                  { icono: MapPin, texto: 'Ubicación y radio' },
                ].map(({ icono: I, texto }) => (
                  <li key={texto} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2">
                    <I className="h-4 w-4 text-blue-600" aria-hidden />
                    {texto}
                  </li>
                ))}
              </ul>
            </div>
          </Tarjeta>
        </ul>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ metas

/** Metas del caso DSY1105 (§2.4 y §4.1). Son OBJETIVOS del proyecto, no mediciones de SyncPass. */
const METAS = [
  { valor: '< 5 s', texto: 'por persona al registrar la asistencia', antes: 'antes, 45 s con planilla de papel' },
  { valor: '> 65 %', texto: 'de respuesta en las encuestas', antes: 'antes, 15 % por correo' },
  { valor: '-80 %', texto: 'de horas de digitación y consolidación', antes: 'antes, todo a mano' },
  { valor: '100 %', texto: 'operativa sin conexión en terreno', antes: 'antes, sin señal no se podía' },
];

function Metas() {
  return (
    <section aria-labelledby="metas" className="bg-slate-900 text-white">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-300">Lo que nos proponemos</p>
          <h2 id="metas" className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Menos papel, más tiempo para la comunidad
          </h2>
        </div>
        <ul className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {METAS.map(({ valor, texto, antes }) => (
            <li key={valor} className="bg-slate-900 p-7">
              <p className="bg-gradient-to-r from-[#60a5fa] to-[#22d3ee] bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
                {valor}
              </p>
              <p className="mt-3 text-slate-100">{texto}</p>
              <p className="mt-1 text-sm text-slate-400">{antes}</p>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-center text-sm text-slate-400">
          Metas del caso DSY1105 (§2.4 y §4.1). Son objetivos del proyecto, todavía no mediciones.
        </p>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ contacto

function Contacto() {
  return (
    <section id="contacto" className="scroll-mt-16 bg-white">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0a3fd1] via-[#0b63f6] to-[#1a9bff] p-8 text-white sm:p-14">
          <div aria-hidden className="absolute -right-16 -top-16 -z-10 h-72 w-72 rounded-full bg-white/10" />
          <div aria-hidden className="absolute -bottom-24 left-1/3 -z-10 h-72 w-72 rounded-full bg-cyan-300/25" />

          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">¿Listo para conectar a tu comunidad?</h2>
              <p className="mt-4 max-w-lg text-lg leading-relaxed text-blue-100">
                Los coordinadores ingresan desde esta web. Los monitores registran la asistencia desde la app Android con su
                cuenta de monitor.
              </p>
              <Link
                href="/ingresar"
                className="mt-8 inline-flex min-h-[52px] items-center gap-2 rounded-full bg-white px-8 text-base font-semibold text-blue-700 shadow-lg shadow-blue-900/30 transition-colors hover:bg-blue-50"
              >
                Iniciar sesión <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>

            <dl className="space-y-4 rounded-3xl bg-white/10 p-6 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <GraduationCap className="mt-0.5 h-6 w-6 shrink-0 text-blue-200" aria-hidden />
                <div>
                  <dt className="font-semibold">Proyecto académico</dt>
                  <dd className="mt-1 text-blue-100">DSY1105 · Desarrollo de Aplicaciones Móviles · Duoc UC, CITT Plaza Vespucio.</dd>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Users className="mt-0.5 h-6 w-6 shrink-0 text-blue-200" aria-hidden />
                <div>
                  <dt className="font-semibold">¿Necesitas una cuenta?</dt>
                  <dd className="mt-1 text-blue-100">Pídesela al equipo de coordinación: las cuentas de coordinador y de monitor las crea el equipo.</dd>
                </div>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <footer className="border-t border-slate-200 px-5 py-8 text-center text-xs text-slate-500">
        <span className="inline-block">
          <Logo tamano="grande" />
        </span>
        <p className="mt-3">SyncPass · Gestión de proyectos comunitarios</p>
      </footer>
    </section>
  );
}

// ------------------------------------------------------------------ página

export function InicioPagina() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Cabecera />
      <main>
        <Inicio />
        <ComoFunciona />
        <Servicios />
        <Metas />
      </main>
      <Contacto />
    </div>
  );
}
