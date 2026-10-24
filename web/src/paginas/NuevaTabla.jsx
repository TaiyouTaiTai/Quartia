import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useEnvio } from '../api/hooks.js';
import * as datasets from '../api/datasets.js';
import Campo from '../componentes/Campo.jsx';
import Alerta from '../componentes/Alerta.jsx';

// La cuadrícula es una sola matriz de textos: la fila 0 son los encabezados.
const vacia = (filas, columnas) => Array.from({ length: filas }, () => Array(columnas).fill(''));
const MAX_FILAS_EDITOR = 1000; // más que eso se vuelve lento: mejor subir el archivo

// Pega un bloque copiado de Excel (filas con \n, celdas con \t) a partir de
// la celda (r0, c0), agrandando la cuadrícula si hace falta.
function pegarBloque(matriz, r0, c0, bloque) {
  const alto = Math.max(matriz.length, r0 + bloque.length);
  const ancho = Math.max(matriz[0].length, c0 + Math.max(...bloque.map(f => f.length)));
  const nueva = Array.from({ length: alto }, (_, r) =>
    Array.from({ length: ancho }, (_, c) => matriz[r]?.[c] ?? ''));
  bloque.forEach((fila, i) => fila.forEach((v, j) => { nueva[r0 + i][c0 + j] = v.trim(); }));
  return nueva;
}

// Una tabla guardada → matriz de textos para el editor (con una fila vacía al final para seguir escribiendo)
function aMatriz({ columnas, filas }) {
  const texto = (v) => (v === null || v === undefined ? '' : String(v));
  return [columnas.map(texto), ...filas.map(f => columnas.map((_, c) => texto(f[c]))), columnas.map(() => '')];
}

// Quita filas y columnas completamente vacías antes de enviar
function limpiar(matriz) {
  const columnasUsadas = matriz[0].map((_, c) => matriz.some(f => f[c].trim() !== ''));
  const recortada = matriz.map(f => f.filter((_, c) => columnasUsadas[c]));
  const [encabezados, ...filas] = recortada;
  return {
    columnas: encabezados.map(v => v.trim() || null),
    filas: filas.filter(f => f.some(v => v.trim() !== '')).map(f => f.map(v => v.trim() || null))
  };
}

export default function NuevaTabla() {
  const navegar = useNavigate();
  return (
    <EditorTabla
      titulo="Crear tabla" textoBoton="Guardar tabla"
      alGuardar={async (tabla) => {
        const { id } = await datasets.crear(tabla);
        navegar(`/tablas/${id}`, { state: { nueva: true } });
      }}
    />
  );
}

// Cuadrícula editable, para crear una tabla o editar una existente.
// inicial: { titulo, columnas, filas } · alGuardar({ titulo, columnas, filas }) → promesa
// aviso: texto que se muestra junto al botón (ej. que se borrarán los análisis)
export function EditorTabla({ titulo: tituloPagina, migas, inicial, aviso, textoBoton, cancelarA = '/', alGuardar }) {
  const [titulo, setTitulo] = useState(inicial?.titulo ?? '');
  const [matriz, setMatriz] = useState(() => (inicial ? aMatriz(inicial) : vacia(6, 3)));
  const { errores, mensaje, enviando, enviar, setMensaje } = useEnvio();

  const cambiar = (r, c) => (e) => {
    const v = e.target.value;
    setMatriz(m => m.map((f, i) => (i === r ? f.map((x, j) => (j === c ? v : x)) : f)));
  };

  const alPegar = (r, c) => (e) => {
    const texto = e.clipboardData.getData('text');
    if (!/[\t\n]/.test(texto)) return; // un solo valor: pegado normal
    e.preventDefault();
    const bloque = texto.replace(/\r/g, '').replace(/\n$/, '').split('\n').map(l => l.split('\t'));
    if (r + bloque.length > MAX_FILAS_EDITOR) {
      setMensaje(`Eso son ${bloque.length} filas: para tablas grandes es mejor subir el archivo desde "Mis tablas".`);
      return;
    }
    setMatriz(m => pegarBloque(m, r, c, bloque));
  };

  const agregarFila = () => setMatriz(m => [...m, Array(m[0].length).fill('')]);
  const agregarColumna = () => setMatriz(m => m.map(f => [...f, '']));

  function alEnviar(e) {
    e.preventDefault();
    const { columnas, filas } = limpiar(matriz);
    if (columnas.length === 0 || filas.length === 0) {
      setMensaje('La tabla está vacía: escribe los nombres de las columnas y al menos una fila de datos.');
      return;
    }
    enviar(() => alGuardar({ titulo: titulo.trim() || undefined, columnas, filas }));
  }

  const [encabezados, ...filas] = matriz;
  const nombreColumna = (c) => encabezados[c].trim() || `Columna ${c + 1}`;

  return (
    <main className="pagina">
      <p className="migas"><Link to="/">Mis tablas</Link> / {migas ?? 'Nueva tabla'}</p>
      <h1>{tituloPagina}</h1>
      <p className="lapiz consejo">
        Consejo: copia celdas en Excel o Google Sheets y pégalas en cualquier casilla; la tabla crece sola.
      </p>

      <form onSubmit={alEnviar} className="nueva-tabla">
        <div style={{ maxWidth: 420 }}>
          <Campo
            etiqueta="Nombre de la tabla" placeholder="Ej. Notas del parcial"
            value={titulo} onChange={e => setTitulo(e.target.value)} error={errores.titulo}
          />
        </div>

        <div className="tarjeta editor-tabla">
          <div className="desplazable">
            <table>
              <thead>
                <tr>
                  <th scope="col" className="editor-num"><span className="solo-lector">Fila</span></th>
                  {encabezados.map((v, c) => (
                    <th scope="col" key={c}>
                      <input
                        value={v} placeholder={`Columna ${c + 1}`} aria-label={`Nombre de la columna ${c + 1}`}
                        onChange={cambiar(0, c)} onPaste={alPegar(0, c)}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.map((fila, i) => (
                  <tr key={i}>
                    <td className="editor-num">{i + 1}</td>
                    {fila.map((v, c) => (
                      <td key={c}>
                        <input
                          value={v} aria-label={`${nombreColumna(c)}, fila ${i + 1}`}
                          onChange={cambiar(i + 1, c)} onPaste={alPegar(i + 1, c)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="editor-acciones">
            <button type="button" className="boton" onClick={agregarFila}>+ Fila</button>
            <button type="button" className="boton" onClick={agregarColumna}>+ Columna</button>
            <span className="campo-ayuda">Las filas y columnas vacías se ignoran al guardar.</span>
          </div>
        </div>

        {/* Errores de validación que no son del título (ej. una celda demasiado larga) */}
        <Alerta>{mensaje || Object.entries(errores).find(([campo]) => campo !== 'titulo')?.[1]}</Alerta>
        <div className="editor-acciones">
          <button type="submit" className="boton boton-primario" disabled={enviando}>
            {enviando ? 'Guardando…' : textoBoton}
          </button>
          <Link to={cancelarA} className="boton boton-enlace">Cancelar</Link>
          {aviso && <span className="campo-ayuda">{aviso}</span>}
        </div>
      </form>
    </main>
  );
}
