import type { ReactNode } from 'react';
import { Link, Route, Router, Switch } from 'wouter';
import { useHashLocation } from 'wouter/use-hash-location';
import { AuthProvider } from './auth/AuthContext';
import { useAuth } from './auth/contexto';
import { EventoPagina } from './paginas/EventoPagina';
import { EventosPagina } from './paginas/EventosPagina';
import { LoginPagina } from './paginas/LoginPagina';

/** Cabecera con el usuario y el cierre de sesión, común a las pantallas del panel. */
function Marco({ children }: { children: ReactNode }) {
  const { estado, cerrarSesion } = useAuth();
  const usuario = estado.tipo === 'activa' ? estado.usuario : null;

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="text-lg font-extrabold tracking-tight">
            SyncPass <span className="font-medium text-zinc-500 dark:text-zinc-400">· Panel del coordinador</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-zinc-600 dark:text-zinc-300">{usuario?.nombre || usuario?.email}</span>
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
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}

function NoEncontrada() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-bold">Página no encontrada</h1>
      <Link href="/" className="mt-4 inline-block font-medium text-indigo-600 dark:text-indigo-400">
        Volver a los eventos
      </Link>
    </div>
  );
}

/** Sin sesión se ve el login en cualquier dirección; al entrar se conserva la dirección que se pidió. */
function Rutas() {
  const { estado } = useAuth();
  if (estado.tipo === 'anonimo') return <LoginPagina />;

  return (
    <Marco>
      <Switch>
        <Route path="/" component={EventosPagina} />
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
