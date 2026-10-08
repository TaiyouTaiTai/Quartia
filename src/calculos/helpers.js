// Redondeo seguro
export function redondear(n, decimales = 4) {
  if (n === null || n === undefined || isNaN(n)) return null;
  return Number(n.toFixed(decimales));
}

// Ordenar array numérico (copiando)
export function ordenar(arr) {
  return [...arr].sort((a, b) => a - b);
}

// Suma
export function suma(arr) {
  return arr.reduce((acc, v) => acc + v, 0);
}

// Producto (para media geométrica)
export function producto(arr) {
  return arr.reduce((acc, v) => acc * v, 1);
}

// Construir el objeto de respuesta estándar
export function resultado(estadistico, { valor, formula, formula_latex, datos_usados, pasos, simbolos = [] }) {
  return {
    estadistico,
    valor,
    formula_latex,
    formula_texto: formula,
    datos_usados,
    pasos,
    simbolos
  };
}
