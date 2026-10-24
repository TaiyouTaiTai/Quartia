import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router';
import { useCargar, useTitulo } from '../api/hooks.js';
import { ErrorApi } from '../api/cliente.js';
import * as datasets from '../api/datasets.js';
import * as calculos from '../api/calculos.js';
import * as analisisApi from '../api/analisis.js';
import Alerta from '../componentes/Alerta.jsx';
import EditarColumna from '../componentes/EditarColumna.jsx';
import TablaDatos from '../componentes/TablaDatos.jsx';
import PanelCalculo from '../componentes/PanelCalculo.jsx';
import { TarjetasResultado, Explicacion } from '../componentes/Resultados.jsx';
import PanelGrafica from '../componentes/PanelGrafica.jsx';
import Grafica from '../componentes/Grafica.jsx';
import NoEncontrada from './NoEncontrada.jsx';
import { ORIGENES, fecha, fechaHora, plural } from '../textos.js';

const MAX_FILAS_EDITABLES = 1000; // igual que el editor de tablas

export default function Detalle() {
  const { id } = useParams();
  const { state } = useLocation();
  const [params, setParams] = useSearchParams();
  const idAnalisis = Number(params.get('analisis')) || null;

  const { datos: tabla, error, cargando, recargar } = useCargar(() => datasets.obtener(id), [id]);
  const { datos: catalogo, error: errorCatalogo } = useCargar(calculos.obtenerCatalogo, []);
  const [editando, setEditando] = useState(null);  // columna abierta en el diálogo
  const [modo, setModo] = useState('calcular');    // pestaña: calcular | graficar | historial
  // El análisis abierto: todo lo que se calcula o grafica se va sumando a él
  const [analisis, setAnalisis] = useState(null);
  const [ultimo, setUltimo] = useState(null);      // { errores, avisos } del último cálculo
  const [elegido, setElegido] = useState(null);    // resultado cuya explicación se muestra
  const [errorAnalisis, setErrorAnalisis] = useState('');
  useTitulo(tabla?.titulo);

  // Abrir el análisis que dice la URL (?analisis=7), ej. desde el historial
  useEffect(() => {
    if (!idAnalisis || idAnalisis === analisis?.id) return;
    let vigente = true;
    analisisApi.obtener(idAnalisis)
      .then(a => {
        if (!vigente) return;
        if (String(a.dataset_id) !== String(id)) throw new ErrorApi(404, 'Ese análisis no es de esta tabla.');
        setAnalisis(a);
        setElegido(a.resultados[0] ?? null);
        setUltimo(null);
        setErrorAnalisis('');
      })
      .catch(err => {
        if (!vigente) return;
        setErrorAnalisis(err.status === 404 ? 'Ese análisis ya no existe; puedes empezar uno nuevo.' : err.message);
        setParams({}, { replace: true });
      });
    return () => { vigente = false; };
  }, [idAnalisis, analisis?.id, id, setParams]);

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

  const columnaDe = (r) => tabla.columnas.find(c => c.id === r.columna_id);
  const decimalesDe = (r) => columnaDe(r)?.decimales ?? 2;

  function abrir(a) {
    setAnalisis(a);
    setParams(a ? { analisis: String(a.id) } : {}, { replace: true });
  }

  function alCalcular({ analisis: a, errores, avisos }) {
    setUltimo({ errores, avisos });
    if (!a) return;
    // Mostrar el primero de los resultados recién calculados
    const antes = new Set((analisis?.resultados ?? []).map(r => r.id));
    setElegido(a.resultados.find(r => !antes.has(r.id)) ?? a.resultados.at(-1) ?? null);
    abrir(a);
  }

  function alGraficar({ analisis_id, grafica }) {
    abrir(analisis
      ? { ...analisis, graficas: [...analisis.graficas, grafica] }
      : { id: analisis_id, dataset_id: tabla.id, creado_en: new Date().toISOString(), resultados: [], graficas: [grafica] });
  }

  function empezarNuevo() {
    abrir(null);
    setElegido(null);
    setUltimo(null);
  }

  function abrirDelHistorial(idA) {
    setModo('calcular');
    setParams({ analisis: String(idA) }, { replace: true });
  }

  function alBorrarDelHistorial(idA) {
    if (analisis?.id === idA) empezarNuevo();
  }

  function alCerrarEdicion(guardo) {
    setEditando(null);
    if (guardo) recargar(); // los resultados ya guardados no cambian; solo la tabla y los permisos
  }

  const editable = tabla.n_filas <= MAX_FILAS_EDITABLES;

  return (
    <main className="pagina">
      <p className="migas"><Link to="/">Mis tablas</Link> / {tabla.titulo}</p>
      <div className="titulo-pagina">
        <div>
          <h1>{tabla.titulo}</h1>
          <p className="secundario">
            {plural(tabla.n_filas, 'fila', 'filas')} · {plural(tabla.n_columnas, 'columna', 'columnas')}
            {' · '}{ORIGENES[tabla.origen]} · {fecha(tabla.creado_en)}
          </p>
        </div>
        {editable
          ? <Link to={`/tablas/${tabla.id}/editar`} className="boton">Editar datos</Link>
          : <p className="campo-ayuda" style={{ maxWidth: 280 }}>Esta tabla es muy grande para editarla aquí: corrige el archivo y súbelo de nuevo.</p>}
      </div>

      {(state?.nueva || state?.editada || tabla.avisos.length > 0) && (
        <Revision nueva={state?.nueva} editada={state?.editada} avisos={tabla.avisos} />
      )}

      <div className="detalle-cuerpo">
        <div className="detalle-datos">
          <TablaDatos tabla={tabla} resaltado={resaltado} alEditar={setEditando} />
        </div>

        <div className="detalle-analisis">
          <Alerta>{errorAnalisis}</Alerta>
          {analisis && (
            <p className="analisis-abierto">
              Análisis del {fechaHora(analisis.creado_en)}: lo que calcules o grafiques se guarda aquí.
              <button type="button" className="boton boton-enlace" onClick={empezarNuevo}>Empezar uno nuevo</button>
            </p>
          )}

          <div className="pestanas" role="tablist" aria-label="Qué hacer con la tabla">
            {[['calcular', 'Calcular'], ['graficar', 'Graficar'], ['historial', 'Historial']].map(([m, texto]) => (
              <button
                key={m} type="button" role="tab" id={`pestana-${m}`} aria-controls={`panel-${m}`}
                aria-selected={modo === m} className="pestana" onClick={() => setModo(m)}
              >
                {texto}
              </button>
            ))}
          </div>

          <div role="tabpanel" id="panel-calcular" aria-labelledby="pestana-calcular" hidden={modo !== 'calcular'} className="panel-pestana">
            {errorCatalogo && <Alerta>No se pudo cargar el catálogo de estadísticos: {errorCatalogo.message}</Alerta>}
            {catalogo && (
              <PanelCalculo key={tabla.actualizado_en} tabla={tabla} catalogo={catalogo} analisisId={analisis?.id} alCalcular={alCalcular} />
            )}

            {ultimo?.errores.length > 0 && (
              <div className="revision">
                <p className="revision-subtitulo">No se calculó:</p>
                <ul>
                  {ultimo.errores.map(e => (
                    <li key={e.clave}><strong>{catalogo.get(e.clave)?.nombre ?? e.clave}:</strong> {e.error}</li>
                  ))}
                </ul>
              </div>
            )}
            {ultimo?.avisos.length > 0 && (
              <ul className="avisos-calculo">
                {ultimo.avisos.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            )}

            {catalogo && analisis?.resultados.length > 0 && (
              <section className="resultados" aria-label="Resultados" aria-live="polite">
                <p className="campo-ayuda">Toca un resultado para ver cómo salió.</p>
                <TarjetasResultado
                  resultados={analisis.resultados} elegido={elegido} alElegir={setElegido} decimalesDe={decimalesDe}
                />
                {elegido && columnaDe(elegido) && (
                  <Explicacion resultado={elegido} definicion={catalogo.get(elegido.clave)} columna={columnaDe(elegido)} />
                )}
              </section>
            )}
          </div>

          <div role="tabpanel" id="panel-graficar" aria-labelledby="pestana-graficar" hidden={modo !== 'graficar'} className="panel-pestana">
            <PanelGrafica key={tabla.actualizado_en} tabla={tabla} analisisId={analisis?.id} alGraficar={alGraficar} />
            {[...(analisis?.graficas ?? [])].reverse().map(g => (
              <Grafica key={g.id} config={g.config} decimales={decimalesDe(g)} />
            ))}
          </div>

          <div role="tabpanel" id="panel-historial" aria-labelledby="pestana-historial" hidden={modo !== 'historial'} className="panel-pestana">
            {modo === 'historial' && (
              <Historial tablaId={tabla.id} abiertoId={analisis?.id} alAbrir={abrirDelHistorial} alBorrar={alBorrarDelHistorial} />
            )}
          </div>
        </div>
      </div>

      {editando && <EditarColumna tablaId={tabla.id} columna={editando} alCerrar={alCerrarEdicion} />}
    </main>
  );
}

// Los análisis guardados de esta tabla. Se vuelve a pedir cada vez que se abre la pestaña.
function Historial({ tablaId, abiertoId, alAbrir, alBorrar }) {
  const { datos: lista, error, cargando, recargar } = useCargar(() => analisisApi.listar(tablaId), [tablaId]);
  const [confirmando, setConfirmando] = useState(null);
  const [errorBorrar, setErrorBorrar] = useState('');

  async function borrar(idA) {
    try {
      await analisisApi.borrar(idA);
      setConfirmando(null);
      alBorrar(idA);
      recargar();
    } catch (err) {
      if (!(err instanceof ErrorApi)) throw err;
      setErrorBorrar(err.message);
    }
  }

  if (cargando && !lista) return <p role="status" className="secundario">Cargando el historial…</p>;
  if (error) return <Alerta>{error.message}</Alerta>;
  if (lista.length === 0) {
    return <p className="lapiz vacio">Todavía no hay análisis guardados. Calcula o grafica algo y aparecerá aquí.</p>;
  }
  return (
    <>
      <Alerta>{errorBorrar}</Alerta>
      <ul className="historial">
        {lista.map((a, i) => (
          <li key={a.id} className={`tarjeta historial-item${a.id === abiertoId ? ' abierto' : ''}`}>
            <div>
              {/* La lista viene del más nuevo al más viejo: el más viejo es el 1 */}
              <p className="historial-titulo">{a.nombre ?? `Análisis ${lista.length - i}`} <span className="secundario">· {fechaHora(a.creado_en)}</span></p>
              <p className="secundario">
                {plural(a.n_resultados, 'resultado', 'resultados')} · {plural(a.n_graficas, 'gráfica', 'gráficas')}
                {a.id === abiertoId && ' · abierto ahora'}
              </p>
            </div>
            {confirmando === a.id ? (
              <div className="confirmar" role="group" aria-label="¿Borrar este análisis?">
                <span>¿Borrar este análisis y lo que tiene?</span>
                <button type="button" className="boton boton-peligro" onClick={() => borrar(a.id)}>Sí, borrar</button>
                <button type="button" className="boton boton-enlace" onClick={() => setConfirmando(null)}>Cancelar</button>
              </div>
            ) : (
              <div className="historial-acciones">
                {a.id !== abiertoId && <button type="button" className="boton" onClick={() => alAbrir(a.id)}>Abrir</button>}
                <button type="button" className="boton boton-enlace" onClick={() => setConfirmando(a.id)}>Borrar</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

// Nota amable con lo que se revisó al cargar (o editar) la tabla
function Revision({ nueva, editada, avisos }) {
  return (
    <section className="revision" aria-label="Revisión de la tabla">
      {(nueva || editada) && (
        <p className="lapiz revision-titulo">
          {editada ? 'Guardamos los cambios. ' : 'Tu tabla está lista. '}
          {avisos.length ? 'Revisamos los datos y esto es lo que encontramos:' : 'Los datos se ven bien.'}
        </p>
      )}
      {!nueva && !editada && <p className="revision-subtitulo">Al cargar esta tabla encontramos:</p>}
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
