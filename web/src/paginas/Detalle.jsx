import { useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { useCargar } from '../api/hooks.js';
import * as datasets from '../api/datasets.js';
import * as calculos from '../api/calculos.js';
import Alerta from '../componentes/Alerta.jsx';
import EditarColumna from '../componentes/EditarColumna.jsx';
import TablaDatos from '../componentes/TablaDatos.jsx';
import PanelCalculo from '../componentes/PanelCalculo.jsx';
import { TarjetasResultado, Explicacion } from '../componentes/Resultados.jsx';
import PanelGrafica from '../componentes/PanelGrafica.jsx';
import Grafica from '../componentes/Grafica.jsx';
import NoEncontrada from './NoEncontrada.jsx';
import { ORIGENES, fecha, plural } from '../textos.js';

export default function Detalle() {
  const { id } = useParams();
  const { state } = useLocation();
  const { datos: tabla, error, cargando, recargar } = useCargar(() => datasets.obtener(id), [id]);
  const { datos: catalogo, error: errorCatalogo } = useCargar(calculos.obtenerCatalogo, []);
  const [editando, setEditando] = useState(null); // columna abierta en el diálogo
  const [calculo, setCalculo] = useState(null);   // { analisis, errores, avisos, columna }
  const [elegido, setElegido] = useState(null);   // resultado cuya explicación se muestra
  const [modo, setModo] = useState('calcular');   // pestaña: calcular | graficar
  const [graficas, setGraficas] = useState([]);   // las de esta visita, la más nueva primero

  // Qué celdas resaltar según el resultado elegido
  const resaltado = useMemo(() => {
    if (!elegido) return null;
    const u = elegido.datos_usados;
    return {
      columnaId: elegido.columna_id,
      filas: new Set(u.filas),
      excluidos: new Map(u.excluidos.map(e => [e.fila, e.motivo]))
    };
  }, [elegido]);

  if (error?.status === 404 || error?.status === 400) return <NoEncontrada />;
  if (error) return <main className="pagina"><Alerta>{error.message}</Alerta></main>;
  if (cargando && !tabla) return <p role="status" className="cargando">Abriendo tu tabla…</p>;

  function alCalcular(respuesta, columna) {
    setCalculo({ ...respuesta, columna });
    setElegido(respuesta.analisis?.resultados[0] ?? null);
  }

  function alCerrarEdicion(guardo) {
    setEditando(null);
    if (!guardo) return;
    // Cambió la escala o los decimales: los resultados mostrados ya no corresponden
    setCalculo(null);
    setElegido(null);
    setGraficas([]);
    recargar();
  }

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

      <div className="detalle-cuerpo">
        <div className="detalle-datos">
          <TablaDatos tabla={tabla} resaltado={resaltado} alEditar={setEditando} />
        </div>

        <div className="detalle-analisis">
          <div className="pestanas" role="tablist" aria-label="Qué hacer con la tabla">
            {[['calcular', 'Calcular'], ['graficar', 'Graficar']].map(([m, texto]) => (
              <button
                key={m} type="button" role="tab" id={`pestana-${m}`} aria-controls={`panel-${m}`}
                aria-selected={modo === m} className="pestana" onClick={() => setModo(m)}
              >
                {texto}
              </button>
            ))}
          </div>

          <div role="tabpanel" id="panel-graficar" aria-labelledby="pestana-graficar" hidden={modo !== 'graficar'} className="panel-pestana">
            <PanelGrafica
              key={tabla.actualizado_en} tabla={tabla}
              alGraficar={(g, columna) => setGraficas(gs => [{ ...g, decimales: columna.decimales }, ...gs])}
            />
            {graficas.map(g => <Grafica key={g.id} config={g.config} decimales={g.decimales} />)}
          </div>

          <div role="tabpanel" id="panel-calcular" aria-labelledby="pestana-calcular" hidden={modo !== 'calcular'} className="panel-pestana">
            {errorCatalogo && <Alerta>No se pudo cargar el catálogo de estadísticos: {errorCatalogo.message}</Alerta>}
            {catalogo && <PanelCalculo key={tabla.actualizado_en} tabla={tabla} catalogo={catalogo} alCalcular={alCalcular} />}

            {calculo && (
              <section className="resultados" aria-label="Resultados" aria-live="polite">
                {calculo.errores.length > 0 && (
                  <div className="revision">
                    <p className="revision-subtitulo">No se calculó:</p>
                    <ul>
                      {calculo.errores.map(e => (
                        <li key={e.clave}><strong>{catalogo.get(e.clave)?.nombre ?? e.clave}:</strong> {e.error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {calculo.avisos.length > 0 && (
                  <ul className="avisos-calculo">
                    {calculo.avisos.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                )}
                {calculo.analisis && (
                  <>
                    <p className="campo-ayuda">Toca un resultado para ver cómo salió.</p>
                    <TarjetasResultado
                      resultados={calculo.analisis.resultados} elegido={elegido} alElegir={setElegido}
                      decimales={calculo.columna.decimales}
                    />
                    {elegido && (
                      <Explicacion resultado={elegido} definicion={catalogo.get(elegido.clave)} columna={calculo.columna} />
                    )}
                  </>
                )}
              </section>
            )}
          </div>
        </div>
      </div>

      {editando && <EditarColumna tablaId={tabla.id} columna={editando} alCerrar={alCerrarEdicion} />}
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
