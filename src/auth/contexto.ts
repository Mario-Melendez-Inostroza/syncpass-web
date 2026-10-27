import { createContext, useContext } from 'react';
import type { Usuario } from './jwt';

/** El usuario inició sesión bien, pero no tiene permiso para este panel. */
export class AccesoDenegadoError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'AccesoDenegadoError';
  }
}

export type EstadoAuth = { tipo: 'anonimo' } | { tipo: 'activa'; usuario: Usuario };

export interface AuthContextValor {
  estado: EstadoAuth;
  /** Lanza ApiError / SinConexionError / AccesoDenegadoError con un mensaje listo para mostrar. */
  iniciarSesion: (email: string, password: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValor | null>(null);

export function useAuth(): AuthContextValor {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return contexto;
}
