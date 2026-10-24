import { useEffect, useRef } from 'react';
import { ESCALAS, TIPOS, plural } from '../textos.js';

// Más filas que esto congelan el navegador; los cálculos sí usan todas
const FILAS_VISIBLES = 200;

// Tabla de datos de un dataset. `resaltado` marca lo que usó un cálculo:
// { columnaId, filas: Set de índices usados, excluidos: Map índice → motivo }
export default function TablaDatos({ tabla, resaltado, alEditar }) {
  const filas = tabla.datos.filas;
  const marcada = (col) => resaltado?.columnaId === col.id;
  const caja = useRef(null);

  // Si la tabla es más ancha que su recuadro, desplazarla hasta la columna usada
  useEffect(() => {
    const th = caja.current?.querySelector('th.columna-marcada');
    if (!th) return;
    const c = caja.current;
    c.scrollTo({ left: th.offsetLeft - (c.clientWidth - th.offsetWidth) / 2, behavior: 'smooth' });
  }, [resaltado]);

  return (
    <section className="tarjeta" aria-label="Datos">
      <div className="desplazable" ref={caja}>
        <table className="tabla-datos">
          <thead>
            <tr>
              <th scope="col" className="tabla-num">#</th>
              {tabla.columnas.map(col => (
                <th
                  scope="col" key={col.id}
                  className={[col.tipo_dato === 'numerico' && 'num', marcada(col) && 'columna-marcada'].filter(Boolean).join(' ') || undefined}
                >
                  <span className="columna-encabezado">
                    <span>{col.nombre}{col.unidad && <span className="secundario"> ({col.unidad})</span>}</span>
                    <button
                      type="button" className="boton-icono" onClick={() => alEditar(col)}
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
                {tabla.columnas.map(col => (
                  <Celda
                    key={col.id} valor={fila[col.posicion]} numerica={col.tipo_dato === 'numerico'}
                    usada={marcada(col) && resaltado.filas.has(i)}
                    motivoExcluida={marcada(col) ? resaltado.excluidos.get(i) : undefined}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {resaltado && (
        <p className="tabla-pie">
          <mark className="marcatextos">Resaltadas</mark>: las celdas que se usaron en el cálculo.
          {resaltado.excluidos.size > 0 && <> <span className="excluida">Tachadas</span>: las que se dejaron fuera.</>}
        </p>
      )}
      {filas.length > FILAS_VISIBLES && (
        <p className="tabla-pie">
          Se muestran las primeras {FILAS_VISIBLES} de {filas.length.toLocaleString('es-GT')} filas. Los cálculos usan todas.
        </p>
      )}
    </section>
  );
}

function Celda({ valor, numerica, usada, motivoExcluida }) {
  const texto = valor === null ? <span className="celda-vacia" aria-label="vacía">—</span> : String(valor);
  return (
    <td className={numerica ? 'num' : undefined}>
      {usada && <mark className="marcatextos">{texto}</mark>}
      {motivoExcluida && <span className="excluida" title={`Se dejó fuera: ${motivoExcluida}`}>{texto}</span>}
      {!usada && !motivoExcluida && texto}
    </td>
  );
}
