import { pedir } from './cliente.js';

export const listar = () => pedir('/datasets');

export const obtener = (id) => pedir(`/datasets/${id}`);

export function subirArchivo(archivo, titulo) {
  const form = new FormData();
  form.append('archivo', archivo);
  if (titulo) form.append('titulo', titulo);
  return pedir('/datasets/archivo', { metodo: 'POST', body: form });
}

// { titulo, columnas: [...], filas: [[...]] }
export const crear = (tabla) => pedir('/datasets', { metodo: 'POST', body: tabla });

export const borrar = (id) => pedir(`/datasets/${id}`, { metodo: 'DELETE' });

// cambios: { nombre?, escala?, unidad?, decimales? }
export const actualizarColumna = (id, columnaId, cambios) =>
  pedir(`/datasets/${id}/columnas/${columnaId}`, { metodo: 'PATCH', body: cambios });

// Reemplaza todos los datos. El backend borra los análisis anteriores.
export const reemplazar = (id, tabla) => pedir(`/datasets/${id}`, { metodo: 'PUT', body: tabla });
