import { pedir } from './cliente.js';

// { dataset_id, columna_id, estadisticos: ['media', { clave: 'cuartil', parametro: 3 }],
//   agrupado, metodo_clases, poblacional } → { analisis, errores, avisos }
export const calcular = (pedido) => pedir('/calculos', { metodo: 'POST', body: pedido });

// El catálogo didáctico casi nunca cambia: se pide una sola vez por sesión.
// Devuelve un Map clave → definición (nombre, fórmula, símbolos, escalas, cuándo usar…).
let catalogo = null;
export function obtenerCatalogo() {
  catalogo ??= pedir('/definiciones')
    .then(defs => new Map(defs.map(d => [d.clave, d])))
    .catch(err => { catalogo = null; throw err; }); // si falla, reintentar la próxima vez
  return catalogo;
}
