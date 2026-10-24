import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { useCargar } from '../api/hooks.js';
import * as datasets from '../api/datasets.js';
import Alerta from '../componentes/Alerta.jsx';
import EditarColumna from '../componentes/EditarColumna.jsx';
import NoEncontrada from './NoEncontrada.jsx';
import { ESCALAS, TIPOS, ORIGENES, fecha, plural } from '../textos.js';

// Más filas que esto congelan el navegador; los cálculos sí usan todas
const FILAS_VISIBLES = 200;

export default function Detalle() {
  const { id } = useParams();
  const { state } = useLocation();
  const { datos: tabla, error, cargando, recargar } = useCargar(() => datasets.obtener(id), [id]);
  const [editando, setEditando] = useState(null); // columna abierta en el diálogo

  if (error?.status === 404 || error?.status === 400) return <NoEncontrada />;
  if (error) return <main className="pagina"><Alerta>{error.message}</Alerta></main>;
  if (cargando && !tabla) return <p role="status" className="cargando">Abriendo tu tabla…</p>;

  const filas = tabla.datos.filas;
  return (
    <main className="pagina">
      <p className="migas"><Link to="/">Mis tablas</Link> / {tabla.titulo}</p>
      <div>
        <h1>{tabla.titulo}</h1>
        <p className="secundario">
          {plural(tabla.n_filas, 'fila', 'filas')} · {plural(tabla.n_columnas, 'columna', 'columnas')}
          {' · '}{ORIGENES[tabla.origen]} · {fecha(tabla.creado_en)}
        </p>
      </div>

      {(state?.nueva || tabla.avisos.length > 0) && <Revision nueva={state?.nueva} avisos={tabla.avisos} />}

      <section className="tarjeta" aria-label="Datos">
        <div className="desplazable">
          <table className="tabla-datos">
            <thead>
              <tr>
                <th scope="col" className="tabla-num">#</th>
                {tabla.columnas.map(col => (
                  <th scope="col" key={col.id} className={col.tipo_dato === 'numerico' ? 'num' : undefined}>
                    <span className="columna-encabezado">
                      <span>{col.nombre}{col.unidad && <span className="secundario"> ({col.unidad})</span>}</span>
                      <button
                        type="button" className="boton-icono" onClick={() => setEditando(col)}
                        aria-label={`Editar la columna ${col.nombre}`} title="Corregir nombre, escala, unidad o decimales"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </span>
                    <span className="columna-meta">
                      {ESCALAS[col.escala].nombre} · {TIPOS[col.tipo_dato]}
                      {col.n_nulos > 0 && ` · ${plural(col.n_nulos, 'vacía', 'vacías')}`}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.slice(0, FILAS_VISIBLES).map((fila, i) => (
                <tr key={i}>
                  <td className="tabla-num">{i + 1}</td>
                  {tabla.columnas.map(col => {
                    const v = fila[col.posicion];
                    return (
                      <td key={col.id} className={col.tipo_dato === 'numerico' ? 'num' : undefined}>
                        {v === null ? <span className="celda-vacia" aria-label="vacía">—</span> : String(v)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filas.length > FILAS_VISIBLES && (
          <p className="tabla-pie">
            Se muestran las primeras {FILAS_VISIBLES} de {filas.length.toLocaleString('es')} filas. Los cálculos usan todas.
          </p>
        )}
      </section>

      {editando && (
        <EditarColumna
          tablaId={tabla.id}
          columna={editando}
          alCerrar={(guardo) => { setEditando(null); if (guardo) recargar(); }}
        />
      )}
    </main>
  );
}

// Nota amable con lo que se revisó al cargar la tabla
function Revision({ nueva, avisos }) {
  return (
    <section className="revision" aria-label="Revisión de la tabla">
      {nueva && (
        <p className="lapiz revision-titulo">
          {avisos.length ? 'Tu tabla está lista. Revisamos los datos y esto es lo que encontramos:' : 'Tu tabla está lista y los datos se ven bien.'}
        </p>
      )}
      {!nueva && <p className="revision-subtitulo">Al cargar esta tabla encontramos:</p>}
      {avisos.length > 0 && (
        <ul>
          {avisos.map((a, i) => <li key={i}>{a.mensaje}</li>)}
        </ul>
      )}
      <p className="campo-ayuda">
        Revisa la escala de cada columna (el lápiz junto al nombre): de ella depende qué cálculos tienen sentido.
      </p>
    </section>
  );
}
