import { useState, type FormEvent } from 'react';
import { Link } from 'wouter';
import { registrarAsistente } from '../api/endpoints';
import fondoHero from '../assets/fondo-hero.webp';
import { useAuth } from '../auth/contexto';
import { CLASE_BOTON_PRIMARIO, CLASE_CAMPO } from '../componentes';
import { Logo } from '../marca';

const TIPOS = [
  { valor: 'VECINO', texto: 'Vecino o vecina' },
  { valor: 'ESTUDIANTE', texto: 'Estudiante' },
  { valor: 'DOCENTE', texto: 'Docente' },
] as const;

/**
 * Crear la cuenta de asistente (caso §3.1: el Beneficiario Comunitario se registra, ve los talleres y se inscribe).
 * Solo se pide correo, contraseña y tipo: la base no guarda nombre ni correo, solo un código sintético (§5.1).
 */
export function RegistroPagina() {
  const { iniciarSesion } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tipo, setTipo] = useState<(typeof TIPOS)[number]['valor']>('VECINO');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (enviando) return;
    if (!email.includes('@')) return setError('Escribe un correo válido.');
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
    setError(null);
    setEnviando(true);
    try {
      await registrarAsistente({ email: email.trim(), password, tipo });
      // La cuenta ya queda confirmada: se entra directo.
      await iniciarSesion(email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear la cuenta.');
      setEnviando(false);
    }
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-[#f4f8ff] bg-cover bg-center p-6"
      style={{ backgroundImage: `url(${fondoHero})` }}
    >
      <form
        onSubmit={enviar}
        noValidate
        className="flex w-full max-w-md flex-col gap-4 rounded-3xl border border-white bg-white p-8 shadow-[0_30px_70px_-30px_rgba(11,60,160,0.55)]"
      >
        <header className="text-center">
          <h1 className="flex justify-center">
            <Logo tamano="grande" />
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-600">Crear mi cuenta de asistente</p>
        </header>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Correo
          <input type="email" name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={enviando} className={CLASE_CAMPO} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Contraseña
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={enviando}
            className={CLASE_CAMPO}
          />
          <span className="text-xs font-normal text-slate-500">Mínimo 8 caracteres.</span>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Soy
          <select value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)} disabled={enviando} className={CLASE_CAMPO}>
            {TIPOS.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.texto}
              </option>
            ))}
          </select>
        </label>

        {error && (
          <p role="alert" className="text-sm text-rose-600">
            {error}
          </p>
        )}

        <button type="submit" disabled={enviando} className={CLASE_BOTON_PRIMARIO}>
          {enviando ? 'Creando tu cuenta…' : 'Crear cuenta'}
        </button>
        <p className="text-center text-xs text-slate-500">
          No guardamos tu nombre: te identificamos con un código y un QR.
        </p>
        <Link href="/ingresar" className="inline-flex min-h-11 items-center justify-center text-sm font-medium text-blue-600">
          Ya tengo cuenta · Iniciar sesión
        </Link>
      </form>
    </main>
  );
}
