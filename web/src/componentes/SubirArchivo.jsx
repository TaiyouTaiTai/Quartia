import { useId, useState } from 'react';
import { useNavigate } from 'react-router';
import { ErrorApi } from '../api/cliente.js';
import * as datasets from '../api/datasets.js';
import Alerta from './Alerta.jsx';

// Zona para arrastrar o elegir un .xlsx / .csv. Al terminar abre la tabla nueva.
export default function SubirArchivo() {
  const navegar = useNavigate();
  const idInput = useId();
  const [arrastrando, setArrastrando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');

  async function subir(archivo) {
    if (!archivo || subiendo) return;
    if (!/\.(xlsx|csv)$/i.test(archivo.name)) {
      setError('Solo se aceptan archivos .xlsx o .csv. Si tu archivo es .xls (Excel antiguo), ábrelo y guárdalo como .xlsx.');
      return;
    }
    setSubiendo(true);
    setError('');
    try {
      const { id } = await datasets.subirArchivo(archivo);
      navegar(`/tablas/${id}`, { state: { nueva: true } });
    } catch (err) {
      if (!(err instanceof ErrorApi)) throw err;
      setError(err.message);
      setSubiendo(false);
    }
  }

  return (
    <div
      className={`zona-subida${arrastrando ? ' arrastrando' : ''}`}
      onDragOver={e => { e.preventDefault(); setArrastrando(true); }}
      onDragLeave={() => setArrastrando(false)}
      onDrop={e => { e.preventDefault(); setArrastrando(false); subir(e.dataTransfer.files[0]); }}
    >
      <svg width="40" height="40" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 15V4m0 0L8 8m4-4 4 4M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" fill="none" stroke="var(--tinta)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="lapiz zona-subida-titulo" role="status">
        {subiendo ? 'Subiendo y revisando tu archivo…' : 'Arrastra aquí tu Excel o CSV'}
      </p>
      <input
        id={idInput} type="file" accept=".xlsx,.csv" className="solo-lector" disabled={subiendo}
        onChange={e => { subir(e.target.files[0]); e.target.value = ''; }}
      />
      <label htmlFor={idInput} className="boton boton-primario" aria-disabled={subiendo}>Elegir archivo</label>
      <p className="campo-ayuda">Archivos .xlsx o .csv. La primera fila debe tener los nombres de las columnas.</p>
      <Alerta>{error}</Alerta>
    </div>
  );
}
