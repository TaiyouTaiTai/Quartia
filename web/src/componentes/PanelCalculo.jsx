import { useId, useMemo, useState } from 'react';
import { useEnvio } from '../api/hooks.js';
import { ErrorApi } from '../api/cliente.js';
import * as calculos from '../api/calculos.js';
import Alerta from './Alerta.jsx';
import { CATEGORIAS, ESCALAS, PARAMETROS } from '../textos.js';

const CON_VERSION_AGRUPADA = ['media', 'mediana', 'moda'];
const USAN_DESVIACION = ['varianza', 'desviacion_estandar', 'coeficiente_variacion'];

// Por qué un estadístico no se puede calcular en esta columna (texto del catálogo)
function motivoNoPermitido(def, columna) {
  const porEscala = def.escalas[columna.escala];
  if (porEscala && !porEscala.permitido) return porEscala.motivo ?? `No aplica a la escala ${ESCALAS[columna.escala].nombre.toLowerCase()}.`;
  return `Necesita una columna numérica y "${columna.nombre}" no lo es.`;
}

// Formulario: columna, estadísticos y opciones. alCalcular(respuesta, columna)
export default function PanelCalculo({ tabla, catalogo, alCalcular }) {
  const idColumna = useId();
  const columnaInicial = tabla.columnas.find(c => c.tipo_dato === 'numerico') ?? tabla.columnas[0];
  const [columnaId, setColumnaId] = useState(columnaInicial.id);
  const [elegidos, setElegidos] = useState(() => new Set());
  const [parametros, setParametros] = useState(() =>
    Object.fromEntries(Object.entries(PARAMETROS).map(([k, p]) => [k, String(p.porDefecto)])));
  const [agrupado, setAgrupado] = useState(false);
  const [metodo, setMetodo] = useState('sturges');
  const [poblacional, setPoblacional] = useState(false);
  const { mensaje, enviando, enviar, setMensaje } = useEnvio();

  const columna = tabla.columnas.find(c => c.id === columnaId);
  const numerica = columna.tipo_dato === 'numerico';

  // Permitidos agrupados por categoría y, aparte, los que no aplican con su motivo
  const { grupos, noPermitidos } = useMemo(() => {
    const permitidos = new Set(columna.estadisticos_permitidos);
    const calculables = [...catalogo.values()].filter(d => d.calculable);
    const grupos = Object.entries(CATEGORIAS)
      .map(([cat, nombre]) => ({ cat, nombre, defs: calculables.filter(d => d.categoria === cat && permitidos.has(d.clave)) }))
      .filter(g => g.defs.length);
    const noPermitidos = calculables.filter(d => !permitidos.has(d.clave));
    return { grupos, noPermitidos };
  }, [catalogo, columna]);

  function cambiarColumna(e) {
    setColumnaId(Number(e.target.value));
    setElegidos(new Set());
    setMensaje('');
  }

  function alternar(clave) {
    setElegidos(s => {
      const nuevo = new Set(s);
      if (nuevo.has(clave)) nuevo.delete(clave); else nuevo.add(clave);
      return nuevo;
    });
  }

  function alEnviar(e) {
    e.preventDefault();
    if (elegidos.size === 0) {
      setMensaje('Elige al menos un estadístico para calcular.');
      return;
    }
    const estadisticos = [...elegidos].map(clave =>
      PARAMETROS[clave] ? { clave, parametro: Number(parametros[clave]) } : clave);
    enviar(async () => {
      try {
        const r = await calculos.calcular({
          dataset_id: tabla.id,
          columna_id: columna.id,
          estadisticos,
          agrupado: numerica && agrupado,
          metodo_clases: metodo,
          poblacional
        });
        alCalcular(r, columna);
      } catch (err) {
        // Ninguno se pudo calcular: el backend explica el motivo de cada uno
        if (err instanceof ErrorApi && err.datos?.errores) {
          alCalcular({ analisis: null, errores: err.datos.errores, avisos: [] }, columna);
          return;
        }
        throw err;
      }
    });
  }

  const mostrarAgrupado = numerica && [...elegidos].some(c => CON_VERSION_AGRUPADA.includes(c));
  const mostrarPoblacional = [...elegidos].some(c => USAN_DESVIACION.includes(c));

  return (
    <form className="tarjeta panel-calculo" onSubmit={alEnviar}>
      <h2>Calcular</h2>

      <div className="campo">
        <label htmlFor={idColumna}>Columna</label>
        <select id={idColumna} value={columnaId} onChange={cambiarColumna}>
          {tabla.columnas.map(c => (
            <option key={c.id} value={c.id}>{c.nombre} — {ESCALAS[c.escala].nombre.toLowerCase()}</option>
          ))}
        </select>
      </div>

      {grupos.length === 0 && (
        <p className="secundario" style={{ margin: 0 }}>
          Con esta columna no hay estadísticos disponibles. Prueba con otra o corrige su escala.
        </p>
      )}

      {grupos.map(g => (
        <fieldset key={g.cat} className="grupo-estadisticos">
          <legend>{g.nombre}</legend>
          {g.defs.map(d => (
            <div key={d.clave} className="estadistico">
              <label>
                <input type="checkbox" checked={elegidos.has(d.clave)} onChange={() => alternar(d.clave)} />
                {d.nombre}
              </label>
              {PARAMETROS[d.clave] && elegidos.has(d.clave) && (
                <input
                  type="number" className="parametro" aria-label={`${PARAMETROS[d.clave].etiqueta} (${d.nombre})`}
                  min={PARAMETROS[d.clave].min} max={PARAMETROS[d.clave].max} step={PARAMETROS[d.clave].paso} required
                  value={parametros[d.clave]} onChange={e => setParametros(p => ({ ...p, [d.clave]: e.target.value }))}
                />
              )}
            </div>
          ))}
        </fieldset>
      ))}

      {(mostrarAgrupado || mostrarPoblacional) && (
        <fieldset className="grupo-estadisticos opciones">
          <legend>Opciones</legend>
          {mostrarAgrupado && (
            <div className="estadistico">
              <label>
                <input type="checkbox" checked={agrupado} onChange={e => setAgrupado(e.target.checked)} />
                Usar datos agrupados (tabla de frecuencias)
              </label>
              {agrupado && (
                <select aria-label="Cómo elegir el número de clases" value={metodo} onChange={e => setMetodo(e.target.value)}>
                  <option value="sturges">Regla de Sturges</option>
                  <option value="raiz">Raíz de n</option>
                  <option value="scott">Regla de Scott</option>
                </select>
              )}
            </div>
          )}
          {mostrarPoblacional && (
            <div className="estadistico">
              <label>
                <input type="checkbox" checked={poblacional} onChange={e => setPoblacional(e.target.checked)} />
                Son todos los datos de la población (divide entre n, no n − 1)
              </label>
            </div>
          )}
        </fieldset>
      )}

      {noPermitidos.length > 0 && (
        <details className="no-permitidos">
          <summary>¿Por qué no aparecen {noPermitidos.length === 1 ? 'otro estadístico' : `otros ${noPermitidos.length}`}?</summary>
          <ul>
            {noPermitidos.map(d => <li key={d.clave}><strong>{d.nombre}:</strong> {motivoNoPermitido(d, columna)}</li>)}
          </ul>
        </details>
      )}

      <Alerta>{mensaje}</Alerta>
      <button type="submit" className="boton boton-primario" disabled={enviando || grupos.length === 0}>
        {enviando ? 'Calculando…' : 'Calcular'}
      </button>
    </form>
  );
}
