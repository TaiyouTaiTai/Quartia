import { useState } from 'react';
import { ErrorApi } from '../api/cliente.js';
import Logo from '../componentes/Logo.jsx';

// Diseño común de /login y /registro: presentación a la izquierda y el
// formulario en una hoja de papel roto a la derecha (mesa "Inicio de sesión").
export default function Acceso({ children }) {
  return (
    <div className="acceso">
      <main className="acceso-interior">
        <div className="acceso-texto">
          <Logo tamano={84} enlace={false} />
          <h1>Sube tus datos y entiende <em>cómo</em> salió cada resultado.</h1>
          <p className="lapiz">media, mediana, cuartiles, histogramas… paso a paso, como en tu cuaderno.</p>
        </div>
        <div className="acceso-tarjeta papel-sombra">
          <div className="papel-roto">{children}</div>
        </div>
      </main>
    </div>
  );
}

// Estado de un formulario que se envía a la API: errores por campo, mensaje
// general y "enviando" (para desactivar el botón y evitar doble envío).
export function useEnvio(mensajePorEstado = {}) {
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(accion) {
    setEnviando(true);
    setErrores({});
    setMensaje('');
    try {
      await accion();
    } catch (err) {
      if (!(err instanceof ErrorApi)) throw err;
      const hayCampos = Object.keys(err.campos).length > 0;
      setErrores(err.campos);
      setMensaje(hayCampos ? '' : mensajePorEstado[err.status] ?? err.message);
      setEnviando(false);
    }
    // Si sale bien no se reactiva: la página cambia sola (ver SoloSinSesion)
  }

  return { errores, mensaje, enviando, enviar };
}
