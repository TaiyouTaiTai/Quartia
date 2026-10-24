import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { guardarToken, leerToken, cuandoNoAutorizado } from '../api/cliente.js';
import * as auth from '../api/auth.js';

const SesionContext = createContext(null);

export function SesionProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  // Mientras se valida el token guardado no sabemos si hay sesión: no redirigir aún
  const [cargando, setCargando] = useState(() => Boolean(leerToken()));

  const cerrarSesion = useCallback(() => {
    guardarToken(null);
    setUsuario(null);
  }, []);

  useEffect(() => {
    cuandoNoAutorizado(cerrarSesion);
    if (!leerToken()) return;
    auth.usuarioActual()
      .then(setUsuario)
      .catch(() => cerrarSesion()) // token vencido o API caída: se pide entrar de nuevo
      .finally(() => setCargando(false));
  }, [cerrarSesion]);

  const entrar = useCallback(async (datos) => {
    const { token, usuario } = await auth.iniciarSesion(datos);
    guardarToken(token);
    setUsuario(usuario);
  }, []);

  const registrarse = useCallback(async (datos) => {
    const { token, usuario } = await auth.registrar(datos);
    guardarToken(token);
    setUsuario(usuario);
  }, []);

  const valor = useMemo(
    () => ({ usuario, cargando, entrar, registrarse, cerrarSesion }),
    [usuario, cargando, entrar, registrarse, cerrarSesion]
  );
  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}

export function useSesion() {
  return useContext(SesionContext);
}

// Envuelve las páginas que necesitan sesión. Recuerda a dónde quería ir el
// usuario para llevarlo ahí después de entrar.
export function RutaProtegida() {
  const { usuario, cargando } = useSesion();
  const ubicacion = useLocation();
  if (cargando) return <p role="status" className="cargando">Cargando…</p>;
  if (!usuario) return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
  return <Outlet />;
}

// Lo contrario: /login y /registro no tienen sentido si ya hay sesión.
// También es lo que lleva al usuario a donde quería ir justo después de entrar.
export function SoloSinSesion() {
  const { usuario, cargando } = useSesion();
  const ubicacion = useLocation();
  if (cargando) return <p role="status" className="cargando">Cargando…</p>;
  if (usuario) return <Navigate to={ubicacion.state?.desde ?? '/'} replace />;
  return <Outlet />;
}
