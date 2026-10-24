import { useCallback, useEffect, useState } from 'react';
import { ErrorApi } from './cliente.js';

// Carga datos al montar (y cuando cambian `deps`). `recargar()` vuelve a pedirlos.
export function useCargar(cargar, deps) {
  const [estado, setEstado] = useState({ datos: null, error: null, cargando: true });
  const [vuelta, setVuelta] = useState(0);

  useEffect(() => {
    let vigente = true; // si el usuario cambia de página, ignorar la respuesta vieja
    setEstado(e => ({ ...e, cargando: true, error: null }));
    cargar()
      .then(datos => vigente && setEstado({ datos, error: null, cargando: false }))
      .catch(error => vigente && setEstado({ datos: null, error, cargando: false }));
    return () => { vigente = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, vuelta]);

  const recargar = useCallback(() => setVuelta(v => v + 1), []);
  return { ...estado, recargar };
}

// Estado de un formulario que se envía a la API: errores por campo, mensaje
// general y "enviando" (para desactivar el botón y evitar doble envío).
// `mensajePorEstado` reemplaza el texto del backend por uno más amable, ej. { 401: '…' }.
export function useEnvio(mensajePorEstado = {}) {
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(accion) {
    setEnviando(true);
    setErrores({});
    setMensaje('');
    try {
      return await accion();
    } catch (err) {
      if (!(err instanceof ErrorApi)) throw err;
      const hayCampos = Object.keys(err.campos).length > 0;
      setErrores(err.campos);
      setMensaje(hayCampos ? '' : mensajePorEstado[err.status] ?? err.message);
    } finally {
      setEnviando(false);
    }
  }

  return { errores, mensaje, enviando, enviar, setMensaje };
}
