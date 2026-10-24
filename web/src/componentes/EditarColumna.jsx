import { useEffect, useRef, useState } from 'react';
import { useEnvio } from '../api/hooks.js';
import * as datasets from '../api/datasets.js';
import Campo from './Campo.jsx';
import Alerta from './Alerta.jsx';
import { ESCALAS, TIPOS } from '../textos.js';

// Diálogo para corregir lo que se detectó automáticamente en una columna.
// alCerrar(true) si se guardó algo, para recargar la tabla.
export default function EditarColumna({ tablaId, columna, alCerrar }) {
  const dialogo = useRef(null);
  const [nombre, setNombre] = useState(columna.nombre);
  const [escala, setEscala] = useState(columna.escala);
  const [unidad, setUnidad] = useState(columna.unidad ?? '');
  const [decimales, setDecimales] = useState(String(columna.decimales ?? 2));
  const { errores, mensaje, enviando, enviar } = useEnvio();

  useEffect(() => {
    const d = dialogo.current;
    d.showModal();
    return () => d.close(); // StrictMode monta dos veces: sin esto el 2.º showModal falla
  }, []);

  function alEnviar(e) {
    e.preventDefault();
    // Solo se envía lo que cambió
    const cambios = {};
    if (nombre.trim() !== columna.nombre) cambios.nombre = nombre.trim();
    if (escala !== columna.escala) cambios.escala = escala;
    if ((unidad.trim() || null) !== (columna.unidad ?? null)) cambios.unidad = unidad.trim() || null;
    if (Number(decimales) !== columna.decimales) cambios.decimales = Number(decimales);
    if (Object.keys(cambios).length === 0) return alCerrar(false);
    enviar(async () => {
      await datasets.actualizarColumna(tablaId, columna.id, cambios);
      alCerrar(true);
    });
  }

  const numerica = columna.tipo_dato === 'numerico';
  return (
    <dialog ref={dialogo} className="dialogo" aria-labelledby="editar-titulo" onCancel={() => alCerrar(false)}>
      <form onSubmit={alEnviar} className="dialogo-form">
        <div>
          <h2 id="editar-titulo">Corregir columna</h2>
          <p className="secundario" style={{ margin: '4px 0 0' }}>
            Detectamos que es {TIPOS[columna.tipo_dato]}. Si algo no cuadra, corrígelo aquí.
          </p>
        </div>

        <Campo etiqueta="Nombre" required value={nombre} onChange={e => setNombre(e.target.value)} error={errores.nombre} />

        <fieldset className="escalas">
          <legend>Escala de medición</legend>
          {Object.entries(ESCALAS).map(([clave, info]) => (
            <label key={clave} className={`escala${escala === clave ? ' elegida' : ''}`}>
              <input type="radio" name="escala" value={clave} checked={escala === clave} onChange={() => setEscala(clave)} />
              <span>
                <strong>{info.nombre}</strong> — {info.explicacion}
                <span className="secundario escala-ejemplo">Ej.: {info.ejemplo}</span>
              </span>
            </label>
          ))}
          {errores.escala && <p className="campo-error">{errores.escala}</p>}
        </fieldset>

        {numerica && (
          <div className="dialogo-fila">
            <Campo
              etiqueta="Unidad (opcional)" placeholder="puntos, kg, años…" maxLength={40}
              value={unidad} onChange={e => setUnidad(e.target.value)} error={errores.unidad}
            />
            <Campo
              etiqueta="Decimales en los resultados" type="number" min={0} max={10} required
              value={decimales} onChange={e => setDecimales(e.target.value)} error={errores.decimales}
            />
          </div>
        )}

        <Alerta>{mensaje}</Alerta>
        <div className="editor-acciones">
          <button type="submit" className="boton boton-primario" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Guardar cambios'}
          </button>
          <button type="button" className="boton boton-enlace" onClick={() => alCerrar(false)}>Cancelar</button>
        </div>
      </form>
    </dialog>
  );
}
