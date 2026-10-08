export function puntosHistograma(distribucion) {
  return {
    tipo: 'histograma',
    datos: distribucion.clases.map(c => ({
      lim_inf: c.lim_inf,
      lim_sup: c.lim_sup,
      marca_clase: c.marca_clase,
      fi: c.fi,
      hi: c.hi
    })),
    config: {
      x_axis: 'Clases',
      y_axis: 'Frecuencia (fi)',
      barras: distribucion.clases.map(c => c.fi)
    }
  };
}

export function puntosPoligono(distribucion) {
  return {
    tipo: 'poligono',
    datos: distribucion.clases.map(c => ({
      x: c.marca_clase,
      y: c.fi
    })),
    config: {
      x_axis: 'Marca de clase',
      y_axis: 'Frecuencia (fi)'
    }
  };
}

export function puntosOjiva(distribucion) {
  return {
    tipo: 'ojiva',
    datos: distribucion.clases.map(c => ({
      x: c.lim_sup,
      y: c.fi_acum
    })),
    config: {
      x_axis: 'Límite superior',
      y_axis: 'Frecuencia acumulada (Fi)'
    }
  };
}
