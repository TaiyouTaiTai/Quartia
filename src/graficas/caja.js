export function puntosCaja(resumen) {
  return {
    tipo: 'caja',
    datos: {
      minimo: resumen.valor.minimo,
      q1: resumen.valor.q1,
      mediana: resumen.valor.mediana,
      q3: resumen.valor.q3,
      maximo: resumen.valor.maximo,
      atipicos: resumen.valor.atipicos
    },
    config: {
      orientacion: 'vertical'
    }
  };
}
