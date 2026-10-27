import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChartColumn,
  Cloud,
  Database,
  FolderOpen,
  Layers,
  Quote,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Users,
  Wifi,
  Zap,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'wouter';

/**
 * Página de inicio pública de SyncPass. Es lo que ve quien aún no inició sesión; con sesión, la raíz es el panel.
 *
 * Todo el contenido es institucional y ficticio (caso §5.1). OJO con "Impacto real": las cifras (+60 %, +85 %, -50 %)
 * son las de la imagen de referencia del diseño y son ILUSTRATIVAS, no mediciones de SyncPass. Las metas que sí
 * declara el caso (§2.4 y §4.1) son otras: de 45 s a menos de 5 s por registro y de 15 % a más de 65 % de respuesta
 * en encuestas. Antes de presentar esta página como resultado real hay que reemplazarlas por datos medidos.
 *
 * Las rutas usan "#" (hash), así que los enlaces internos NO pueden ser `href="#seccion"`: cambiarían la ruta. Se
 * desplaza con scrollIntoView.
 */

const FONDO_HERO = `${import.meta.env.BASE_URL}assets/fondo_hero.png`;

function irA(id: string) {
  const destino = document.getElementById(id);
  if (id === 'inicio' || !destino) window.scrollTo?.({ top: 0, behavior: 'smooth' });
  else destino.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
}

// ------------------------------------------------------------------ piezas comunes

function Logo({ tamano = 'grande' }: { tamano?: 'grande' | 'pequeno' }) {
  const caja = tamano === 'grande' ? 'h-10 w-10 rounded-xl' : 'h-8 w-8 rounded-lg';
  const texto = tamano === 'grande' ? 'text-[32px]' : 'text-2xl';
  return (
    <span className="inline-flex items-center gap-3">
      <span
        className={`grid ${caja} place-items-center bg-gradient-to-b from-[#3a86ff] to-[#1450e6] shadow-[0_0_24px_rgba(37,99,235,0.55)]`}
      >
        <Check className="h-3/5 w-3/5 text-white" strokeWidth={3.5} aria-hidden />
      </span>
      <span className={`${texto} font-extrabold leading-none tracking-tight`}>
        Sync<span className="text-[#2aa0ff]">Pass</span>
      </span>
    </span>
  );
}

/** Etiqueta pequeña en mayúsculas sobre los títulos de sección. */
function Etiqueta({ icono: Icono, children }: { icono: LucideIcon; children: ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#2f8cff]">
      <Icono className="h-3.5 w-3.5" aria-hidden />
      {children}
    </p>
  );
}

const TEXTO_DEGRADADO = 'bg-gradient-to-r from-[#2a8cff] via-[#13c3e3] to-[#18d7a6] bg-clip-text text-transparent';

const BOTON_AZUL =
  'bg-gradient-to-b from-[#2487ff] to-[#0b5be0] shadow-[0_8px_28px_rgba(20,100,240,0.45)] hover:from-[#3a95ff] hover:to-[#1c6cf0]';

// ------------------------------------------------------------------ cabecera

const NAVEGACION = [
  { id: 'inicio', texto: 'Inicio' },
  { id: 'caracteristicas', texto: 'Características' },
  { id: 'funcionalidades', texto: 'Funcionalidades' },
  { id: 'impacto', texto: 'Impacto' },
  { id: 'tecnologia', texto: 'Tecnología' },
  { id: 'contacto', texto: 'Contacto' },
];

function Cabecera() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#050b21]/95">
      <div className="mx-auto flex h-[72px] max-w-[1536px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-[82px]">
        <Link href="/" aria-label="SyncPass, inicio" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Secciones" className="hidden items-center gap-9 text-sm lg:flex">
          {NAVEGACION.map(({ id, texto }) => (
            <button
              key={id}
              type="button"
              onClick={() => irA(id)}
              className={`relative min-h-11 px-0.5 font-medium transition-colors hover:text-white ${
                id === 'inicio' ? 'text-white' : 'text-slate-300'
              }`}
            >
              {texto}
              {id === 'inicio' && <span className="absolute -bottom-[14px] left-0 right-0 h-0.5 rounded bg-[#2a8cff]" />}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => irA('funcionalidades')}
            className="hidden min-h-11 rounded-lg border border-white/25 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:block"
          >
            Conocer más
          </button>
          <Link
            href="/ingresar"
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-5 text-sm font-semibold text-white ${BOTON_AZUL}`}
          >
            Iniciar sesión <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}

// ------------------------------------------------------------------ hero

const VENTAJAS = [
  { icono: Zap, texto: 'Registro rápido y seguro', color: 'text-emerald-400', fondo: 'bg-emerald-400/15 ring-emerald-400/30' },
  { icono: Wifi, texto: 'Funciona sin conexión', color: 'text-lime-300', fondo: 'bg-lime-300/15 ring-lime-300/30' },
  { icono: ChartColumn, texto: 'Reportes en tiempo real', color: 'text-sky-400', fondo: 'bg-sky-400/15 ring-sky-400/30' },
  { icono: ShieldCheck, texto: 'Datos protegidos y confiables', color: 'text-emerald-400', fondo: 'bg-emerald-400/15 ring-emerald-400/30' },
];

function Hero() {
  return (
    <section id="inicio" className="relative isolate overflow-hidden border-b border-white/10">
      {/* La imagen ya trae el portátil y el teléfono: se ancla a la derecha y se atenúa a la izquierda para el texto. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-[#050b21] bg-cover bg-[position:70%_64%] bg-no-repeat"
        style={{ backgroundImage: `url(${FONDO_HERO})` }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#050b21_0%,rgba(5,11,33,0.94)_36%,rgba(5,11,33,0.55)_50%,transparent_64%)] max-lg:bg-[linear-gradient(90deg,#050b21,rgba(5,11,33,0.8))]"
      />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-t from-[#050b21] to-transparent" />

      <div className="mx-auto max-w-[1536px] px-5 pb-14 pt-10 sm:px-8 lg:min-h-[548px] lg:px-[82px] lg:pb-6 lg:pt-8">
        <div className="max-w-[560px]">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#2a5ca8]/70 bg-[#0e2a5c]/50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#3b95ff]">
            <Users className="h-3.5 w-3.5" aria-hidden />
            Plataforma de gestión comunitaria
          </p>

          <h1 className="mt-7 text-[44px] font-bold leading-[1.02] tracking-tight sm:text-5xl lg:text-[52px]">
            Proyectos que{' '}
            <br />
            conectan.{' '}
            <br />
            <span className={TEXTO_DEGRADADO}>
              Comunidades{' '}
              <br />
              que avanzan.
            </span>
          </h1>

          <p className="mt-5 max-w-[470px] text-[17px] leading-[1.45] text-slate-200">
            SyncPass es una plataforma integral para la gestión de proyectos comunitarios, registro de asistencias y
            evaluación de impacto social. Tecnología simple, segura y diseñada para generar un cambio real.
          </p>

          <div className="mt-7 flex flex-wrap gap-4">
            <Link
              href="/ingresar"
              className={`flex min-h-[60px] min-w-[182px] flex-col items-center justify-center rounded-lg px-6 text-white ${BOTON_AZUL}`}
            >
              <span className="text-base font-semibold">Iniciar sesión</span>
              <span className="flex items-center gap-1 text-[13px] font-normal text-white/85">
                Ir al sistema <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </span>
            </Link>
            <button
              type="button"
              onClick={() => irA('funcionalidades')}
              className="flex min-h-[60px] min-w-[210px] flex-col items-center justify-center rounded-lg border border-white/25 bg-white/[0.03] px-6 text-white transition-colors hover:bg-white/10"
            >
              <span className="text-base font-semibold">Conocer la plataforma</span>
              <span className="text-[13px] font-normal text-slate-300">Descubre sus beneficios</span>
            </button>
          </div>
        </div>

        <ul id="caracteristicas" className="mt-9 grid scroll-mt-24 grid-cols-2 gap-x-6 gap-y-5 lg:flex lg:flex-wrap lg:gap-x-9">
          {VENTAJAS.map(({ icono: Icono, texto, color, fondo }) => (
            <li key={texto} className="flex items-center gap-3">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ring-1 ${fondo}`}>
                <Icono className={`h-5 w-5 ${color}`} aria-hidden />
              </span>
              <span className="max-w-[110px] text-sm leading-tight text-slate-200">{texto}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ solución completa

const FUNCIONALIDADES = [
  {
    icono: FolderOpen,
    titulo: 'Gestión de proyectos',
    texto: 'Organiza y supervisa tus iniciativas comunitarias.',
    color: 'text-emerald-400',
    fondo: 'bg-emerald-400/15',
  },
  {
    icono: CalendarDays,
    titulo: 'Eventos y actividades',
    texto: 'Programa talleres, capacitaciones y encuentros.',
    color: 'text-violet-400',
    fondo: 'bg-violet-400/15',
  },
  {
    icono: Users,
    titulo: 'Registro de asistencias',
    texto: 'Acredita participación de forma rápida y segura (incluso offline).',
    color: 'text-sky-400',
    fondo: 'bg-sky-400/15',
  },
  {
    icono: ChartColumn,
    titulo: 'Encuestas y reportes',
    texto: 'Mide el impacto y visualiza resultados en tiempo real.',
    color: 'text-amber-400',
    fondo: 'bg-amber-400/15',
  },
];

function Solucion() {
  return (
    <section id="funcionalidades" className="mx-auto max-w-[1536px] scroll-mt-20 px-5 py-14 sm:px-8 lg:px-[82px]">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-12">
        <div>
          <Etiqueta icono={Layers}>Solución completa</Etiqueta>
          <h2 className="mt-3 text-[32px] font-bold leading-[1.1] tracking-tight">
            Todo lo que necesitas{' '}
            <br />
            en una sola plataforma
          </h2>
          <p className="mt-4 max-w-[400px] text-base leading-relaxed text-slate-300">
            Simplifica la gestión de proyectos, conecta a las comunidades y obtén información confiable para tomar
            mejores decisiones.
          </p>
          <Link
            href="/ingresar"
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#1f6fe5] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#1f6fe5]/15"
          >
            Conoce todas las funcionalidades <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {FUNCIONALIDADES.map(({ icono: Icono, titulo, texto, color, fondo }) => (
            <li
              key={titulo}
              className="rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-5 transition-colors hover:border-white/20"
            >
              <span className={`grid h-11 w-11 place-items-center rounded-lg ${fondo}`}>
                <Icono className={`h-6 w-6 ${color}`} aria-hidden />
              </span>
              <h3 className="mt-5 text-base font-semibold">{titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{texto}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ impacto real

const CIFRAS = [
  { icono: ArrowUpRight, valor: '+60%', texto: 'Participación en actividades comunitarias', color: 'text-emerald-400' },
  { icono: Users, valor: '+85%', texto: 'Satisfacción en encuestas', color: 'text-violet-400' },
  { icono: ChartColumn, valor: '-50%', texto: 'Tiempo de registro por asistente', color: 'text-sky-400' },
];

/** Ondas luminosas del fondo de esta sección, como en la referencia. Solo decoración. */
function Ondas() {
  return (
    <svg aria-hidden viewBox="0 0 1440 260" preserveAspectRatio="none" className="absolute inset-x-0 top-0 -z-10 h-full w-full opacity-90">
      <defs>
        <linearGradient id="onda-a" x1="0" x2="1">
          <stop offset="0" stopColor="#0b3d99" stopOpacity="0" />
          <stop offset="0.35" stopColor="#1f7bff" stopOpacity="0.9" />
          <stop offset="0.7" stopColor="#12c4e0" stopOpacity="0.8" />
          <stop offset="1" stopColor="#0b3d99" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="onda-b" x1="0" x2="1">
          <stop offset="0" stopColor="#1646b8" stopOpacity="0" />
          <stop offset="0.5" stopColor="#3b82f6" stopOpacity="0.55" />
          <stop offset="1" stopColor="#16d3a8" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 150 C 240 60, 480 40, 720 110 S 1180 200, 1440 90" fill="none" stroke="url(#onda-a)"strokeWidth="3" strokeOpacity="0.8" />
      <path d="M0 175 C 260 95, 520 70, 760 135 S 1200 215, 1440 120" fill="none" stroke="url(#onda-b)" strokeWidth="1.5" />
      <path d="M0 150 C 240 60, 480 40, 720 110 S 1180 200, 1440 90 L1440 260 L0 260 Z" fill="url(#onda-b)" opacity="0.12" />
    </svg>
  );
}

function Impacto() {
  return (
    <section id="impacto" className="relative isolate scroll-mt-20 overflow-hidden">
      <Ondas />
      <div className="mx-auto grid max-w-[1536px] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,430px)_1fr_330px] lg:items-center lg:gap-8 lg:px-[82px]">
        <div>
          <Etiqueta icono={TrendingUp}>Impacto real</Etiqueta>
          <h2 className="mt-3 text-[32px] font-bold leading-[1.1] tracking-tight">
            Datos que impulsan{' '}
            <br />
            <span className={TEXTO_DEGRADADO}>comunidades más fuertes</span>
          </h2>
          <p className="mt-4 max-w-[400px] text-base leading-relaxed text-slate-300">
            Transforma la participación en información valiosa para generar más y mejores oportunidades.
          </p>
        </div>

        <ul className="grid divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {CIFRAS.map(({ icono: Icono, valor, texto, color }) => (
            <li key={valor} className="px-0 py-4 sm:px-6 sm:py-0">
              <div className="flex items-center gap-3">
                <Icono className={`h-7 w-7 shrink-0 ${color}`} aria-hidden />
                <span className={`text-[34px] font-bold leading-none tracking-tight ${color}`}>{valor}</span>
              </div>
              <p className="mt-2 text-sm leading-snug text-slate-300">{texto}</p>
            </li>
          ))}
        </ul>

        <figure className="relative rounded-2xl border border-white/10 bg-[#0a1432]/90 p-6 pb-12">
          <Quote className="h-7 w-7 fill-[#2a8cff] text-[#2a8cff]" aria-hidden />
          <blockquote className="mt-3 text-base leading-relaxed text-slate-100">
            “Información confiable para construir un mayor impacto social.”
          </blockquote>
          <span className="absolute bottom-4 right-4 grid h-8 w-8 place-items-center rounded-full bg-[#1f7bff]">
            <Check className="h-4 w-4 text-white" strokeWidth={3.5} aria-hidden />
          </span>
        </figure>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ tecnología y contacto

const TECNOLOGIAS = [
  { icono: Smartphone, nombre: 'App Android', detalle: 'Kotlin, Jetpack Compose y Room' },
  { icono: Cloud, nombre: 'API REST', detalle: 'Spring Boot en AWS con Cognito' },
  { icono: Database, nombre: 'Base de datos', detalle: 'PostgreSQL gestionado' },
  { icono: ShieldCheck, nombre: 'Seguridad', detalle: 'Acceso por roles y datos ficticios' },
];

function Tecnologia() {
  return (
    <section id="tecnologia" className="mx-auto max-w-[1536px] scroll-mt-20 border-t border-white/10 px-5 py-14 sm:px-8 lg:px-[82px]">
      <Etiqueta icono={Layers}>Tecnología</Etiqueta>
      <h2 className="mt-3 text-[28px] font-bold leading-tight tracking-tight">Pensada para el terreno, respaldada en la nube</h2>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TECNOLOGIAS.map(({ icono: Icono, nombre, detalle }) => (
          <li key={nombre} className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <Icono className="mt-0.5 h-6 w-6 shrink-0 text-[#2f8cff]" aria-hidden />
            <div>
              <h3 className="font-semibold">{nombre}</h3>
              <p className="mt-1 text-sm text-slate-400">{detalle}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Contacto() {
  return (
    <section id="contacto" className="border-t border-white/10 bg-gradient-to-b from-transparent to-[#07122e]">
      <div className="mx-auto flex max-w-[1536px] scroll-mt-20 flex-col items-start justify-between gap-6 px-5 py-12 sm:px-8 md:flex-row md:items-center lg:px-[82px]">
        <div>
          <h2 className="text-[26px] font-bold tracking-tight">¿Listo para conectar a tu comunidad?</h2>
          <p className="mt-2 text-slate-300">Ingresa con tu cuenta de coordinador o usa la app Android si eres monitor.</p>
        </div>
        <Link
          href="/ingresar"
          className={`inline-flex min-h-12 items-center gap-2 rounded-lg px-7 text-base font-semibold text-white ${BOTON_AZUL}`}
        >
          Iniciar sesión <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
      <footer className="border-t border-white/10 px-5 py-6 text-center text-xs text-slate-500">
        <Logo tamano="pequeno" />
        <p className="mt-3">
          Proyecto académico DSY1105 · Duoc UC · Todos los datos mostrados son ficticios.
        </p>
      </footer>
    </section>
  );
}

// ------------------------------------------------------------------ página

export function InicioPagina() {
  return (
    <div className="min-h-screen bg-[#050b21] text-white [font-family:Inter,'Segoe_UI',system-ui,sans-serif]">
      <Cabecera />
      <main>
        <Hero />
        <Solucion />
        <Impacto />
        <Tecnologia />
      </main>
      <Contacto />
    </div>
  );
}
