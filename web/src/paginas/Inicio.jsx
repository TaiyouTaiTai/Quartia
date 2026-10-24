import { useState } from 'react';
import { Link } from 'react-router';
import { useCargar } from '../api/hooks.js';
import * as datasets from '../api/datasets.js';
import { ErrorApi } from '../api/cliente.js';
import SubirArchivo from '../componentes/SubirArchivo.jsx';
import Alerta from '../componentes/Alerta.jsx';
import { ORIGENES, fecha, plural } from '../textos.js';

// "Mis tablas": subir un archivo, crear una tabla y ver las que ya hay.
export default function Inicio() {
  const { datos: tablas, error, cargando, recargar } = useCargar(datasets.listar, []);

  return (
    <main className="pagina">
      <div className="titulo-pagina">
        <div>
          <h1>Mis tablas</h1>
          <p className="secundario">Sube un archivo o crea una tabla para empezar a calcular.</p>
        </div>
        <Link to="/tablas/nueva" className="boton">Crear tabla a mano</Link>
      </div>

      <SubirArchivo />

      {cargando && <p role="status" className="secundario">Cargando tus tablas…</p>}
      {error && <Alerta>{error.message}</Alerta>}
      {tablas?.length === 0 && (
        <p className="lapiz vacio">Todavía no tienes tablas. Empieza subiendo un archivo o creando una a mano.</p>
      )}
      {tablas?.length > 0 && (
        <ul className="lista-tablas" aria-label="Tus tablas">
          {tablas.map(t => <TarjetaTabla key={t.id} tabla={t} alBorrar={recargar} />)}
        </ul>
      )}
    </main>
  );
}

function TarjetaTabla({ tabla, alBorrar }) {
  const [confirmando, setConfirmando] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState('');

  async function borrar() {
    setBorrando(true);
    try {
      await datasets.borrar(tabla.id);
      alBorrar();
    } catch (err) {
      if (!(err instanceof ErrorApi)) throw err;
      setError(err.message);
      setBorrando(false);
    }
  }

  return (
    <li className="tarjeta tarjeta-tabla">
      <Link to={`/tablas/${tabla.id}`} className="tarjeta-tabla-enlace">
        <h2>{tabla.titulo}</h2>
        <p className="secundario">
          {plural(tabla.n_filas, 'fila', 'filas')} · {plural(tabla.n_columnas, 'columna', 'columnas')}
        </p>
        <p className="secundario tarjeta-tabla-pie">
          <span className="chip">{ORIGENES[tabla.origen]}</span> {fecha(tabla.creado_en)}
        </p>
      </Link>
      {confirmando ? (
        <div className="confirmar" role="group" aria-label={`¿Borrar ${tabla.titulo}?`}>
          <span>¿Borrar esta tabla y sus análisis?</span>
          <button type="button" className="boton boton-peligro" onClick={borrar} disabled={borrando}>
            {borrando ? 'Borrando…' : 'Sí, borrar'}
          </button>
          <button type="button" className="boton boton-enlace" onClick={() => setConfirmando(false)}>Cancelar</button>
        </div>
      ) : (
        <button type="button" className="boton boton-enlace tarjeta-tabla-borrar" onClick={() => setConfirmando(true)}>
          Borrar
        </button>
      )}
      <Alerta>{error}</Alerta>
    </li>
  );
}
