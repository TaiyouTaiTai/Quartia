import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import Acceso, { useEnvio } from './Acceso.jsx';
import Campo from '../componentes/Campo.jsx';
import Alerta from '../componentes/Alerta.jsx';
import { useSesion } from '../sesion/Sesion.jsx';

export default function Registro() {
  const { registrarse } = useSesion();
  const ubicacion = useLocation();
  const [datos, setDatos] = useState({ nombre: '', correo: '', clave: '' });
  const { errores, mensaje, enviando, enviar } = useEnvio();

  const cambiar = (campo) => (e) => setDatos(d => ({ ...d, [campo]: e.target.value }));

  function alEnviar(e) {
    e.preventDefault();
    enviar(() => registrarse(datos));
  }

  return (
    <Acceso>
      <form onSubmit={alEnviar} noValidate>
        <h2>Crear cuenta</h2>
        <Alerta>{mensaje}</Alerta>
        <Campo
          etiqueta="Nombre" autoComplete="name" required
          value={datos.nombre} onChange={cambiar('nombre')} error={errores.nombre}
        />
        <Campo
          etiqueta="Correo" type="email" autoComplete="email" placeholder="tu@correo.com" required
          value={datos.correo} onChange={cambiar('correo')} error={errores.correo}
        />
        <Campo
          etiqueta="Contraseña" type="password" autoComplete="new-password" required
          ayuda="Al menos 8 caracteres."
          value={datos.clave} onChange={cambiar('clave')} error={errores.clave}
        />
        <button type="submit" className="boton boton-primario" disabled={enviando}>
          {enviando ? 'Creando tu cuenta…' : 'Crear cuenta'}
        </button>
        <p className="acceso-pie">
          ¿Ya tienes cuenta? <Link to="/login" state={ubicacion.state}>Inicia sesión</Link>
        </p>
      </form>
    </Acceso>
  );
}
