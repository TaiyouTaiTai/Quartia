import { useId, useState } from 'react';
import { useEnvio } from '../api/hooks.js';
import { pedir } from '../api/cliente.js';
import Alerta from './Alerta.jsx';
import { ESCALAS } from '../textos.js';

// Qué muestra cada gráfica, para ayudar a elegir
export const GRAFICAS = {
  histograma: { nombre: 'Histograma', para: 'Cómo se reparten los números en intervalos.' },
  poligono: { nombre: 'Polígono de frecuencias', para: 'La forma de la distribución, como una línea.' },
  ojiva: { nombre: 'Ojiva', para: 'Cuántos datos hay por debajo de cada valor.' },
  caja: { nombre: 'Diagrama de caja', para: 'El centro, la dispersión y los valores atípicos.' },
  barras: { nombre: 'Barras', para: 'Cuántas veces aparece cada categoría.' },
  pastel: { nombre: 'Pastel', para: 'Qué parte del total es cada categoría (pocas categorías).' },
  dispersion: { nombre: 'Dispersión', para: 'Si dos columnas numéricas se mueven juntas.' }
};
const CON_CLASES = ['histograma', 'poligono', 'ojiva'];

// Formulario para generar una gráfica. alGraficar(grafica, columna)
export default function PanelGrafica({ tabla, alGraficar }) {
  const idColumna = useId();
  const idColumnaB = useId();
  const numericas = tabla.columnas.filter(c => c.tipo_dato === 'numerico');
  const [columnaId, setColumnaId] = useState((numericas[0] ?? tabla.columnas[0]).id);
  const [tipo, setTipo] = useState(null);
  const [columnaBId, setColumnaBId] = useState(null);
  const [metodo, setMetodo] = useState('sturges');
  const { mensaje, enviando, enviar, setMensaje } = useEnvio();

  const columna = tabla.columnas.find(c => c.id === columnaId);
  const permitidas = columna.graficas_permitidas;
  const tipoValido = permitidas.includes(tipo) ? tipo : permitidas[0];
  const otrasNumericas = numericas.filter(c => c.id !== columnaId);
  const columnaB = otrasNumericas.find(c => c.id === columnaBId) ?? otrasNumericas[0];

  function alEnviar(e) {
    e.preventDefault();
    if (tipoValido === 'dispersion' && !columnaB) {
      setMensaje('La dispersión necesita otra columna numérica para el eje vertical, y esta tabla solo tiene una.');
      return;
    }
    enviar(async () => {
      const r = await pedir('/graficas', {
        metodo: 'POST',
        body: {
          dataset_id: tabla.id,
          tipo: tipoValido,
          columna_id: columna.id,
          ...(tipoValido === 'dispersion' && { columna_b_id: columnaB.id }),
          metodo_clases: metodo
        }
      });
      alGraficar(r.grafica, columna);
    });
  }

  return (
    <form className="tarjeta panel-calculo" onSubmit={alEnviar}>
      <h2>Graficar</h2>

      <div className="campo">
        <label htmlFor={idColumna}>Columna</label>
        <select id={idColumna} value={columnaId} onChange={e => { setColumnaId(Number(e.target.value)); setMensaje(''); }}>
          {tabla.columnas.map(c => (
            <option key={c.id} value={c.id}>{c.nombre} — {ESCALAS[c.escala].nombre.toLowerCase()}</option>
          ))}
        </select>
      </div>

      <fieldset className="tipos-grafica">
        <legend>Tipo de gráfica</legend>
        {permitidas.map(t => (
          <label key={t} className={`tipo-grafica${tipoValido === t ? ' elegida' : ''}`}>
            <input type="radio" name="tipo" value={t} checked={tipoValido === t} onChange={() => setTipo(t)} />
            <span>
              <strong>{GRAFICAS[t].nombre}</strong>
              <span className="secundario">{GRAFICAS[t].para}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {CON_CLASES.includes(tipoValido) && (
        <div className="campo" style={{ maxWidth: 280 }}>
          <label htmlFor={`${idColumna}-clases`}>Número de clases</label>
          <select id={`${idColumna}-clases`} value={metodo} onChange={e => setMetodo(e.target.value)}>
            <option value="sturges">Regla de Sturges</option>
            <option value="raiz">Raíz de n</option>
            <option value="scott">Regla de Scott</option>
          </select>
        </div>
      )}

      {tipoValido === 'dispersion' && columnaB && (
        <div className="campo" style={{ maxWidth: 360 }}>
          <label htmlFor={idColumnaB}>Columna del eje vertical</label>
          <select id={idColumnaB} value={columnaB.id} onChange={e => setColumnaBId(Number(e.target.value))}>
            {otrasNumericas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
      )}

      <Alerta>{mensaje}</Alerta>
      <button type="submit" className="boton boton-primario" disabled={enviando}>
        {enviando ? 'Dibujando…' : 'Graficar'}
      </button>
    </form>
  );
}
