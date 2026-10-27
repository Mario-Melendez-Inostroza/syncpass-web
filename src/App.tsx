import type { ReactNode } from 'react';
import { Link, Redirect, Route, Router, Switch } from 'wouter';
import { useHashLocation } from 'wouter/use-hash-location';
import { AuthProvider } from './auth/AuthContext';
import { Logo } from './marca';
import { useAuth } from './auth/contexto';
import { EventoFormPagina } from './paginas/EventoFormPagina';
import { EventoPagina } from './paginas/EventoPagina';
import { EventosPagina } from './paginas/EventosPagina';
import { InicioPagina } from './paginas/InicioPagina';
import { LoginPagina } from './paginas/LoginPagina';
import { ProyectoFormPagina } from './paginas/ProyectoFormPagina';

/** Un id de la dirección solo vale si es un entero positivo; si no, la página no existe. */
function idValido(texto: string | undefined): number | null {
  const id = Number(texto);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Cabecera común a las pantallas del panel: logo, menú y el usuario con su cierre de sesión. */
function Marco({ children }: { children: ReactNode }) {
  const { estado, cerrarSesion } = useAuth();
  const usuario = estado.tipo === 'activa' ? estado.usuario : null;
  const [ruta] = useHashLocation();
  const enEventos = ruta === '/' || ruta.startsWith('/eventos') || ruta.startsWith('/proyectos');

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 dark:border-zinc-800 dark:bg-zinc-900/95">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-8">
            <Link href="/" aria-label="SyncPass, panel del coordinador">
              <Logo />
            </Link>
            <nav aria-label="Panel" className="flex items-center text-sm">
              <Link
                href="/"
                aria-current={enEventos ? 'page' : undefined}
                className={`inline-flex min-h-11 items-center rounded-lg px-3 font-medium ${
                  enEventos
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white'
                }`}
              >
                Eventos
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-right leading-tight sm:block">
              <span className="block font-medium text-zinc-800 dark:text-zinc-100">{usuario?.nombre || usuario?.email}</span>
              <span className="block text-xs text-zinc-500 dark:text-zinc-400">Coordinador</span>
            </span>
            <button
              type="button"
              onClick={() => void cerrarSesion()}
              className="min-h-11 rounded-xl border border-zinc-300 px-4 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}

function NoEncontrada() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-bold">Página no encontrada</h1>
      <Link href="/" className="mt-4 inline-block font-medium text-blue-600 dark:text-blue-400">
        Volver a los eventos
      </Link>
    </div>
  );
}

/** Sin sesión se ve el login en cualquier dirección; al entrar se conserva la dirección que se pidió. */
function Rutas() {
  const { estado } = useAuth();
  // Sin sesión: la raíz es la página de inicio pública; cualquier otra dirección pide iniciar sesión.
  if (estado.tipo === 'anonimo') {
    return (
      <Switch>
        <Route path="/" component={InicioPagina} />
        <Route component={LoginPagina} />
      </Switch>
    );
  }

  return (
    <Marco>
      <Switch>
        <Route path="/" component={EventosPagina} />
        {/* Quien acaba de entrar desde "Iniciar sesión" estaba en /ingresar: al panel. */}
        <Route path="/ingresar">
          <Redirect to="/" replace />
        </Route>
        <Route path="/proyectos/nuevo">{() => <ProyectoFormPagina />}</Route>
        <Route path="/proyectos/:id/editar">
          {(params) => {
            const id = idValido(params.id);
            return id ? <ProyectoFormPagina key={id} id={id} /> : <NoEncontrada />;
          }}
        </Route>
        <Route path="/proyectos/:id/eventos/nuevo">
          {(params) => {
            const id = idValido(params.id);
            return id ? <EventoFormPagina key={id} proyectoInicial={id} /> : <NoEncontrada />;
          }}
        </Route>
        <Route path="/eventos/:id/editar">
          {(params) => {
            const id = idValido(params.id);
            return id ? <EventoFormPagina key={id} id={id} /> : <NoEncontrada />;
          }}
        </Route>
        <Route path="/eventos/:id">
          {(params) => {
            const id = Number(params.id);
            return Number.isInteger(id) && id > 0 ? <EventoPagina key={id} id={id} /> : <NoEncontrada />;
          }}
        </Route>
        <Route component={NoEncontrada} />
      </Switch>
    </Marco>
  );
}

export default function App() {
  // Rutas con "#" (p. ej. /#/eventos/12): la web se puede alojar en S3 o en cualquier hosting estático sin
  // reglas de reescritura de direcciones.
  return (
    <Router hook={useHashLocation}>
      <AuthProvider>
        <Rutas />
      </AuthProvider>
    </Router>
  );
}
