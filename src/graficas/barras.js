export function puntosBarras(datos) {
  // Para datos categóricos: contar frecuencias
  const conteo = {};
  for (const d of datos) conteo[d] = (conteo[d] || 0) + 1;
  const categorias = Object.keys(conteo).sort();
  return {
    tipo: 'barras',
    datos: categorias.map(c => ({ categoria: c, frecuencia: conteo[c] })),
    config: {
      x_axis: 'Categoría',
      y_axis: 'Frecuencia'
    }
  };
}
