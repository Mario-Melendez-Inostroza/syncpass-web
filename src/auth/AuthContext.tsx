import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { cerrarSesionServidor, iniciarSesionServidor } from '../api/endpoints';
import { esAsistente, esCoordinador, esMonitor, usuarioDe } from './jwt';
import { AccesoDenegadoError, AuthContext, type EstadoAuth } from './contexto';
import { sesion } from './sesion';

/**
 * Lee la sesión guardada. Solo cuenta como activa si el token es legible y el usuario es COORDINADOR o ASISTENTE.
 *
 * NO se consulta /api/health para "validar" la sesión, como hacía el original: esa ruta es pública y responde
 * 200 con cualquier token, así que cualquier texto guardado daba por autenticado. La validez real la decide el
 * servidor en cada petición; si el token venció, el cliente HTTP lo renueva o cierra la sesión.
 */
function estadoGuardado(): EstadoAuth {
  const guardada = sesion.leer();
  if (!guardada) return { tipo: 'anonimo' };
  const usuario = usuarioDe(guardada.idToken);
  if (!usuario || !(esCoordinador(usuario) || esAsistente(usuario))) {
    sesion.limpiar();
    return { tipo: 'anonimo' };
  }
  return { tipo: 'activa', usuario };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoAuth>(estadoGuardado);

  // Si la sesión cambia desde fuera (el servidor rechazó la renovación), la interfaz se entera sola.
  useEffect(() => sesion.suscribir(() => setEstado(estadoGuardado())), []);

  const iniciarSesion = useCallback(async (email: string, password: string) => {
    const tokens = await iniciarSesionServidor(email.trim(), password);
    if (!tokens.accessToken || !tokens.idToken) {
      throw new AccesoDenegadoError('La respuesta del servidor está incompleta.');
    }

    const usuario = usuarioDe(tokens.idToken);
    if (!usuario || !(esCoordinador(usuario) || esAsistente(usuario))) {
      // Nunca se guarda la sesión de quien no puede usar esta web.
      throw new AccesoDenegadoError(
        usuario && esMonitor(usuario)
          ? 'Esta web es para coordinadores y asistentes. Tu usuario es de monitor: usa la app Android.'
          : 'Tu usuario no pertenece al grupo COORDINADOR ni ASISTENTE. Pide a un administrador que lo agregue.',
      );
    }

    sesion.guardar({
      accessToken: tokens.accessToken,
      idToken: tokens.idToken,
      refreshToken: tokens.refreshToken ?? null,
      email: email.trim(),
    });
  }, []);

  const cerrarSesion = useCallback(async () => {
    try {
      await cerrarSesionServidor();
    } catch {
      // Sin red o token ya vencido: igualmente se cierra en este navegador.
    } finally {
      sesion.limpiar();
    }
  }, []);

  const valor = useMemo(() => ({ estado, iniciarSesion, cerrarSesion }), [estado, iniciarSesion, cerrarSesion]);
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
