import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import Acceso from './Acceso.jsx';
import { useEnvio, useTitulo } from '../api/hooks.js';
import Campo from '../componentes/Campo.jsx';
import Alerta from '../componentes/Alerta.jsx';
import { useSesion } from '../sesion/Sesion.jsx';

export default function Login() {
  useTitulo('Iniciar sesión');
  const { entrar } = useSesion();
  const ubicacion = useLocation();
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const { errores, mensaje, enviando, enviar } = useEnvio({
    401: 'El correo o la contraseña no coinciden. Revísalos e intenta de nuevo.'
  });

  function alEnviar(e) {
    e.preventDefault();
    enviar(() => entrar({ correo, clave }));
  }

  return (
    <Acceso>
      <form onSubmit={alEnviar} noValidate>
        <h2>Iniciar sesión</h2>
        <Alerta>{mensaje}</Alerta>
        <Campo
          etiqueta="Correo" type="email" autoComplete="email" placeholder="tu@correo.com" required
          value={correo} onChange={e => setCorreo(e.target.value)} error={errores.correo}
        />
        <Campo
          etiqueta="Contraseña" type="password" autoComplete="current-password" required
          value={clave} onChange={e => setClave(e.target.value)} error={errores.clave}
        />
        <button type="submit" className="boton boton-primario" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
        <p className="acceso-pie">
          ¿Primera vez? <Link to="/registro" state={ubicacion.state}>Crea tu cuenta</Link>
        </p>
      </form>
    </Acceso>
  );
}
