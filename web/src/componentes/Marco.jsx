import { NavLink, Outlet } from 'react-router';
import Logo from './Logo.jsx';
import { useSesion } from '../sesion/Sesion.jsx';

const iniciales = (nombre = '') =>
  nombre.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase()).join('') || '?';

// Encabezado común de las páginas con sesión
export default function Marco() {
  const { usuario, cerrarSesion } = useSesion();
  return (
    <>
      <header className="encabezado">
        <div className="encabezado-interior">
          <Logo />
          <nav aria-label="Principal">
            <NavLink to="/" end>Mis tablas</NavLink>
            <div className="usuario">
              <span className="iniciales" aria-hidden="true">{iniciales(usuario.nombre)}</span>
              <span className="secundario">{usuario.nombre}</span>
              <button type="button" className="boton boton-enlace" onClick={cerrarSesion}>Cerrar sesión</button>
            </div>
          </nav>
        </div>
      </header>
      <Outlet />
    </>
  );
}
