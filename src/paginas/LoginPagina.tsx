import { useState, type FormEvent } from 'react';
import { Link } from 'wouter';
import fondoHero from '../assets/fondo-hero.webp';
import { Logo } from '../marca';
import { useAuth } from '../auth/contexto';

/**
 * Inicio de sesión. Al terminar bien no hay que navegar: AuthProvider guarda la sesión y la aplicación
 * cambia de pantalla sola, conservando la dirección a la que se quería entrar.
 */
export function LoginPagina() {
  const { iniciarSesion } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (cargando) return;
    if (!email.includes('@') || !password) {
      setError('Escribe tu correo y tu contraseña.');
      return;
    }
    setError(null);
    setCargando(true);
    try {
      await iniciarSesion(email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión.');
      setCargando(false);
    }
  }

  const campo =
    'w-full min-h-11 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100';

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-[#f4f8ff] bg-cover bg-center p-6"
      style={{ backgroundImage: `url(${fondoHero})` }}
    >
      <form
        onSubmit={enviar}
        noValidate
        className="flex w-full max-w-md flex-col gap-4 rounded-3xl border border-white bg-white p-8 shadow-[0_30px_70px_-30px_rgba(11,60,160,0.55)] dark:border-zinc-800 dark:bg-zinc-900"
      >
        <header className="text-center">
          <h1 className="flex justify-center text-3xl">
            <Logo tamano="grande" />
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-600 dark:text-zinc-400">Panel del coordinador</p>
        </header>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Correo
          <input
            type="email"
            name="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={cargando}
            className={campo}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Contraseña
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={cargando}
            className={campo}
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={cargando}
          className="min-h-12 rounded-xl bg-blue-600 px-4 font-semibold text-white shadow-[0_10px_24px_-12px_rgba(11,99,246,0.7)] transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {cargando ? 'Ingresando…' : 'Iniciar sesión'}
        </button>
        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
          Para coordinadores y asistentes. Los monitores usan la app Android.
        </p>
        <Link href="/registro" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-blue-200 text-sm font-semibold text-blue-700 hover:bg-blue-50">
          Soy asistente y quiero crear mi cuenta
        </Link>
        <Link href="/" className="inline-flex min-h-11 items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-400">
          ← Volver al inicio
        </Link>
      </form>
    </main>
  );
}
