import Formula from './Formula.jsx';
import { numero, plural } from '../textos.js';

// Nombre con su parámetro: "Cuartil 3", "Percentil 90" (el catálogo los nombra en plural)
const SINGULAR = { cuartil: 'Cuartil', decil: 'Decil', percentil: 'Percentil' };
export const nombreResultado = (r) =>
  (r.parametro != null ? `${SINGULAR[r.clave] ?? r.nombre} ${numero(r.parametro)}` : r.nombre)
  + (r.valor_json?.distribucion ? ' (agrupada)' : '');

// El valor tal como se muestra en la tarjeta
export function valorResultado(r, decimales) {
  if (r.clave === 'resumen_caja') return `RIQ ${numero(r.valor_json.riq, decimales)}`;
  if (r.valor_num != null) {
    return numero(r.valor_num, decimales) + (r.clave === 'coeficiente_variacion' ? ' %' : '');
  }
  if (r.valor_txt) return r.valor_txt;
  if (r.clave === 'moda') return 'Sin moda';
  return '—';
}

// Tarjetas: una por resultado; la elegida muestra su explicación debajo
// decimalesDe(r): los decimales de la columna de ese resultado (un análisis puede
// tener resultados de varias columnas)
export function TarjetasResultado({ resultados, elegido, alElegir, decimalesDe }) {
  return (
    <div className="tarjetas-resultado">
      {resultados.map(r => (
        <button
          type="button" key={r.id} className="tarjeta-resultado" aria-pressed={elegido?.id === r.id}
          onClick={() => alElegir(r)}
        >
          <span className="tarjeta-resultado-nombre">{nombreResultado(r)}</span>
          <span className="tarjeta-resultado-valor">{valorResultado(r, decimalesDe(r))}</span>
          <span className="tarjeta-resultado-columna">{r.datos_usados.columna}</span>
        </button>
      ))}
    </div>
  );
}

// En datos agrupados la fórmula usa marcas de clase y frecuencias, no los
// valores sueltos: los símbolos del catálogo (Σxᵢ…) no le corresponden.
const SIMBOLOS_AGRUPADOS = [
  { simbolo_latex: 'm_i', significado: 'marca de clase (punto medio de cada clase)' },
  { simbolo_latex: 'f_i', significado: 'frecuencia: cuántos datos caen en esa clase' },
  { simbolo_latex: 'n', significado: 'el total de datos' }
];

// Un paso del paso a paso: "Suma todos los valores: 70 + 85 + … = 390"
function Paso({ paso }) {
  const { texto, expresion, resultado } = paso;
  const tieneResultado = resultado !== null && resultado !== undefined;
  return (
    <li>
      {texto}
      {(expresion || tieneResultado) && ': '}
      {expresion}
      {expresion && tieneResultado && ' = '}
      {tieneResultado && <span className="tinta">{String(resultado)}</span>}
    </li>
  );
}

// La explicación de UN resultado: el "hover educativo" del contrato
// (fórmula, símbolos, números sustituidos, pasos y datos usados).
export function Explicacion({ resultado: r, definicion: def, columna }) {
  const s = r.sustitucion ?? {};
  const variables = Object.entries(s.variables ?? {});
  const usados = r.datos_usados;
  const distribucion = r.valor_json?.distribucion;
  const caja = r.clave === 'resumen_caja' ? r.valor_json : null;
  const d = columna.decimales ?? 2;
  const simbolos = distribucion ? SIMBOLOS_AGRUPADOS : def?.simbolos ?? [];

  return (
    <div className="papel-sombra">
      <article className="papel-roto explicacion" aria-labelledby="explicacion-titulo">
        <header className="explicacion-cabecera">
          <h2 id="explicacion-titulo">{nombreResultado(r)} = {valorResultado(r, d)}</h2>
          <span className="etiqueta">Así salió</span>
        </header>

        {def?.descripcion && <p className="explicacion-descripcion">{def.descripcion}</p>}

        <div className="explicacion-formula">
          <Formula latex={s.formula_latex ?? def?.formula_latex ?? ''} bloque />
          {variables.length > 0 && (
            <>
              <span className="lapiz flecha" aria-hidden="true">→</span>
              <span className="variables tinta">
                {variables.map(([k, v]) => <Formula key={k} latex={`${k} = ${v}`} />)}
              </span>
            </>
          )}
        </div>

        {simbolos.length > 0 && (
          <dl className="simbolos">
            {simbolos.map(sim => (
              <div key={sim.simbolo_latex}>
                <dt><Formula latex={sim.simbolo_latex} /></dt>
                <dd>{sim.significado}</dd>
              </div>
            ))}
          </dl>
        )}

        <ol className="pasos lapiz">
          {(r.pasos ?? []).map((p, i) => <Paso key={i} paso={p} />)}
        </ol>

        {distribucion && <TablaFrecuencias dist={distribucion} decimales={d} />}
        {caja && <ResumenCaja caja={caja} decimales={d} />}

        <p className="datos-usados">
          Se usaron <strong>{plural(usados.valores.length, 'valor', 'valores')}</strong> de la columna
          «{usados.columna}» (resaltados en la tabla).
          {usados.excluidos.length > 0 && <> Se dejaron fuera {plural(usados.excluidos.length, 'celda', 'celdas')}:</>}
        </p>
        {usados.excluidos.length > 0 && (
          <ul className="excluidos">
            {usados.excluidos.slice(0, 10).map(e => (
              <li key={e.fila}>Fila {e.fila + 1}{e.valor !== null && <> («{String(e.valor)}»)</>}: {e.motivo}</li>
            ))}
            {usados.excluidos.length > 10 && <li>… y {usados.excluidos.length - 10} más.</li>}
          </ul>
        )}

        {(def?.cuando_usar || def?.malinterpretacion) && (
          <div className="consejos">
            {def.cuando_usar && (
              <div>
                <p className="consejo-titulo">Cuándo usarlo</p>
                <p>{def.cuando_usar}</p>
              </div>
            )}
            {def.malinterpretacion && (
              <div>
                <p className="consejo-titulo">Cuidado</p>
                <p>{def.malinterpretacion}</p>
              </div>
            )}
          </div>
        )}
      </article>
    </div>
  );
}

function TablaFrecuencias({ dist, decimales }) {
  const metodo = { sturges: 'Sturges', raiz: 'raíz de n', scott: 'Scott' }[dist.metodo] ?? dist.metodo;
  return (
    <div className="mini-tabla">
      <p className="mini-tabla-titulo">
        Tabla de frecuencias: {plural(dist.k, 'clase', 'clases')} de ancho {numero(dist.ancho, decimales)} (regla de {metodo})
      </p>
      <div className="desplazable">
        <table>
          <thead>
            <tr>
              <th scope="col">Clase</th><th scope="col">Marca (mᵢ)</th><th scope="col">fᵢ</th>
              <th scope="col">Fᵢ</th><th scope="col">%</th>
            </tr>
          </thead>
          <tbody>
            {dist.clases.map((c, i) => (
              <tr key={i}>
                <td>{numero(c.lim_inf, decimales)} – {numero(c.lim_sup, decimales)}</td>
                <td>{numero(c.marca_clase, decimales)}</td>
                <td>{c.fi}</td>
                <td>{c.Fi}</td>
                <td>{numero(c.porcentaje, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResumenCaja({ caja, decimales }) {
  const filas = [
    ['Mínimo', caja.min], ['Q1', caja.q1], ['Mediana (Q2)', caja.mediana], ['Q3', caja.q3],
    ['Máximo', caja.max], ['RIQ (Q3 − Q1)', caja.riq]
  ];
  return (
    <div className="mini-tabla">
      <p className="mini-tabla-titulo">Resumen de cinco números</p>
      <table>
        <tbody>
          {filas.map(([n, v]) => <tr key={n}><th scope="row">{n}</th><td>{numero(v, decimales)}</td></tr>)}
          <tr>
            <th scope="row">Atípicos</th>
            <td>{caja.atipicos.length ? caja.atipicos.map(v => numero(v, decimales)).join(', ') : 'ninguno'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
