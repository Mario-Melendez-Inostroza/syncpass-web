import {
  ArrowRight,
  Check,
  ChartColumn,
  ClipboardList,
  FileSpreadsheet,
  FolderOpen,
  GraduationCap,
  MapPin,
  MessageSquareHeart,
  QrCode,
  Smartphone,
  Users,
  WifiOff,
} from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'wouter';
import { Logo } from '../marca';

/**
 * Página de inicio pública de SyncPass: lo que ve quien aún no inició sesión. Con sesión, la raíz es el panel.
 *
 * Diseño: clara y luminosa, con un fondo de malla de colores hecho solo con CSS (sin imágenes que cargar) y
 * tarjetas de producto dibujadas en código. Una idea por sección: qué es, cómo funciona, qué ofrece y cómo entrar.
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

const BOTON_PRINCIPAL =
  'bg-gradient-to-r from-[#2563eb] to-[#4f46e5] text-white shadow-[0_10px_30px_-8px_rgba(37,99,235,0.6)] hover:from-[#1d58d6] hover:to-[#4338ca]';

const TEXTO_DEGRADADO = 'bg-gradient-to-r from-[#2563eb] via-[#7c3aed] to-[#0ea5a4] bg-clip-text text-transparent';

// ------------------------------------------------------------------ cabecera

function Cabecera() {
  const activa = useSeccionActiva();
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/" aria-label="SyncPass, inicio" className="shrink-0 text-slate-900">
          <Logo />
        </Link>

        <nav aria-label="Secciones" className="flex items-center gap-1 text-sm sm:gap-2">
          {SECCIONES.map(({ id, texto }) => (
            <button
              key={id}
              type="button"
              onClick={() => irA(id)}
              aria-current={activa === id ? 'true' : undefined}
              className={`min-h-11 rounded-full px-4 font-medium transition-colors ${
                activa === id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {texto}
            </button>
          ))}
        </nav>

        <Link
          href="/ingresar"
          className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-5 text-sm font-semibold ${BOTON_PRINCIPAL}`}
        >
          Iniciar sesión <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </header>
  );
}

// ------------------------------------------------------------------ ilustraciones dibujadas en código

/** Un QR decorativo: tres marcas de esquina y módulos generados con una semilla fija (siempre el mismo dibujo). */
function QrDecorativo({ tamano = 150 }: { tamano?: number }) {
  const modulos = useMemo(() => {
    const n = 21;
    const celdas: [number, number][] = [];
    let semilla = 7;
    const azar = () => {
      semilla = (semilla * 1103515245 + 12345) & 0x7fffffff;
      return semilla / 0x7fffffff;
    };
    const esquina = (x: number, y: number) => (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!esquina(x, y) && azar() > 0.52) celdas.push([x, y]);
    return { n, celdas };
  }, []);
  const marca = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={7} height={7} rx={1.4} fill="currentColor" />
      <rect x={x + 1} y={y + 1} width={5} height={5} rx={1} fill="white" />
      <rect x={x + 2} y={y + 2} width={3} height={3} rx={0.6} fill="currentColor" />
    </g>
  );
  return (
    <svg viewBox={`-1 -1 ${modulos.n + 2} ${modulos.n + 2}`} width={tamano} height={tamano} aria-hidden className="text-slate-900">
      {marca(0, 0)}
      {marca(modulos.n - 7, 0)}
      {marca(0, modulos.n - 7)}
      {modulos.celdas.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} rx={0.2} fill="currentColor" />
      ))}
    </svg>
  );
}

function Anillo({ porcentaje }: { porcentaje: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 84 84" className="h-20 w-20 -rotate-90" aria-hidden>
      <circle cx="42" cy="42" r={r} fill="none" stroke="#e2e8f0" strokeWidth="9" />
      <circle
        cx="42"
        cy="42"
        r={r}
        fill="none"
        stroke="url(#anillo)"
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={`${(c * porcentaje) / 100} ${c}`}
      />
      <defs>
        <linearGradient id="anillo" x1="0" x2="1">
          <stop offset="0" stopColor="#2563eb" />
          <stop offset="1" stopColor="#0ea5a4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Composición de tarjetas del producto: escanear, sincronizar y ver el quórum. Ilustrativa. */
function TarjetasProducto() {
  return (
    <div className="relative mx-auto h-[440px] w-full max-w-[460px]" aria-hidden>
      {/* Tarjeta principal: escanear un QR */}
      <div className="anim-flotar absolute left-2 top-4 w-[250px] rounded-3xl border border-white bg-white p-5 shadow-[0_30px_60px_-20px_rgba(30,41,99,0.35)]">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 text-blue-600">
            <QrCode className="h-4 w-4" />
          </span>
          Escanear QR
        </div>
        <div className="mt-4 grid place-items-center rounded-2xl bg-slate-50 p-4">
          <QrDecorativo />
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          <Check className="h-4 w-4" strokeWidth={3} />
          Asistencia registrada
        </div>
      </div>

      {/* Quórum en vivo */}
      <div className="anim-flotar-lento absolute right-0 top-28 w-[210px] rounded-3xl border border-white bg-white p-5 shadow-[0_30px_60px_-20px_rgba(30,41,99,0.35)]">
        <p className="text-sm font-semibold text-slate-800">Quórum en vivo</p>
        <div className="mt-3 flex items-center gap-4">
          <div className="relative grid place-items-center">
            <Anillo porcentaje={72} />
            <span className="absolute rotate-0 text-sm font-bold text-slate-800">72 %</span>
          </div>
          <p className="text-xs leading-snug text-slate-500">de los cupos ocupados</p>
        </div>
      </div>

      {/* Sin conexión */}
      <div className="anim-flotar absolute bottom-12 left-0 flex items-center gap-3 rounded-2xl border border-white bg-white px-4 py-3 shadow-[0_20px_40px_-18px_rgba(30,41,99,0.35)]">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600">
          <WifiOff className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-800">Sin señal</p>
          <p className="text-xs text-slate-500">Se guarda en el teléfono</p>
        </div>
      </div>

      {/* Enviado */}
      <div className="anim-flotar-lento absolute bottom-0 right-6 flex items-center gap-3 rounded-2xl border border-white bg-white px-4 py-3 shadow-[0_20px_40px_-18px_rgba(30,41,99,0.35)]">
        <span className="anim-pulso grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
          <Smartphone className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-800">Sincronizado</p>
          <p className="text-xs text-slate-500">Al volver la señal</p>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ inicio

function Inicio() {
  return (
    <section id="inicio" className="relative isolate overflow-hidden">
      {/* Fondo: malla de color y puntos, solo con degradados CSS. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-[#f6f8ff] bg-[radial-gradient(45%_50%_at_8%_10%,rgba(59,130,246,0.28),transparent_70%),radial-gradient(40%_45%_at_92%_18%,rgba(139,92,246,0.24),transparent_70%),radial-gradient(45%_50%_at_70%_100%,rgba(20,184,166,0.26),transparent_70%),radial-gradient(35%_40%_at_0%_95%,rgba(251,191,36,0.16),transparent_70%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(rgba(79,70,229,0.18)_1px,transparent_1px)] [background-size:26px_26px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
      />

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-24 pt-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:pt-24">
        <div className="anim-aparecer">
          <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
            <Users className="h-3.5 w-3.5" aria-hidden />
            Plataforma de gestión comunitaria
          </p>

          <h1 className="mt-7 text-[42px] font-extrabold leading-[1.02] tracking-tight text-slate-900 sm:text-6xl lg:text-[68px]">
            Proyectos que conectan. <span className={TEXTO_DEGRADADO}>Comunidades que avanzan.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
            SyncPass ayuda a coordinar proyectos comunitarios: se registra la asistencia en terreno con el celular, aunque
            no haya señal, y el equipo ve el quórum y la satisfacción al instante.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/ingresar"
              className={`inline-flex min-h-[52px] items-center gap-2 rounded-full px-8 text-base font-semibold ${BOTON_PRINCIPAL}`}
            >
              Iniciar sesión <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <button
              type="button"
              onClick={() => irA('servicios')}
              className="inline-flex min-h-[52px] items-center rounded-full border border-slate-300 bg-white/70 px-8 text-base font-semibold text-slate-800 transition-colors hover:bg-white"
            >
              Ver servicios
            </button>
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm font-medium text-slate-600">
            {[
              { icono: QrCode, texto: 'Registro por QR' },
              { icono: WifiOff, texto: 'Funciona sin conexión' },
              { icono: FileSpreadsheet, texto: 'Reportes en Excel' },
            ].map(({ icono: Icono, texto }) => (
              <li key={texto} className="flex items-center gap-2">
                <Icono className="h-4 w-4 text-blue-600" aria-hidden />
                {texto}
              </li>
            ))}
          </ul>
        </div>

        <TarjetasProducto />
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
    <section aria-labelledby="como-funciona" className="border-t border-slate-200/70 bg-white">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Cómo funciona</p>
          <h2 id="como-funciona" className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Del plan al informe, en tres pasos
          </h2>
        </div>
        <ol className="mt-14 grid gap-8 md:grid-cols-3">
          {PASOS.map(({ numero, icono: Icono, titulo, texto }) => (
            <li key={numero} className="relative">
              <div className="flex items-center gap-4">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#2563eb] to-[#7c3aed] text-white shadow-lg shadow-blue-500/30">
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
    <section id="servicios" className="scroll-mt-16 bg-[#f6f8ff]">
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
              <p className="bg-gradient-to-r from-[#60a5fa] via-[#a78bfa] to-[#2dd4bf] bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
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
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#1d4ed8] via-[#4f46e5] to-[#7c3aed] p-8 text-white sm:p-14">
          <div aria-hidden className="absolute -right-16 -top-16 -z-10 h-72 w-72 rounded-full bg-white/10" />
          <div aria-hidden className="absolute -bottom-24 left-1/3 -z-10 h-72 w-72 rounded-full bg-teal-300/20" />

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
                  <dd className="mt-1 text-blue-100">Pídesela al equipo docente: las cuentas de coordinador y de monitor las crea el equipo.</dd>
                </div>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <footer className="border-t border-slate-200 px-5 py-8 text-center text-xs text-slate-500">
        <span className="inline-block text-slate-900">
          <Logo tamano="pequeno" />
        </span>
        <p className="mt-3">SyncPass · Gestión de proyectos comunitarios</p>
      </footer>
    </section>
  );
}

// ------------------------------------------------------------------ página

export function InicioPagina() {
  return (
    <div className="min-h-screen bg-white text-slate-900 [font-family:Inter,'Segoe_UI',system-ui,sans-serif]">
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
