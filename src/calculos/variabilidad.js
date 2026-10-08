import { redondear, suma } from './helpers.js';

// ---- RANGO ----
export function rango(datos) {
  const min = Math.min(...datos);
  const max = Math.max(...datos);
  const valor = redondear(max - min);
  return {
    estadistico: 'rango',
    valor,
    formula_latex: 'R = x_{max} - x_{min}',
    formula_texto: 'rango = máximo - mínimo',
    datos_usados: datos,
    pasos: [
      `1. Valor máximo: ${max}`,
      `2. Valor mínimo: ${min}`,
      `3. rango = ${max} - ${min} = ${valor}`
    ],
    simbolos: [{ simbolo_latex: 'R', significado: 'Rango' }]
  };
}

// ---- VARIANZA (poblacional) ----
export function varianza(datos) {
  const n = datos.length;
  const mediaVal = suma(datos) / n;
  const difCuad = datos.map(x => (x - mediaVal) ** 2);
  const s2 = suma(difCuad) / n;
  const valor = redondear(s2);
  return {
    estadistico: 'varianza',
    valor,
    formula_latex: '\\sigma^2 = \\frac{\\sum (x_i - \\bar{x})^2}{n}',
    formula_texto: 'varianza = Σ(xᵢ - media)² / n',
    datos_usados: datos,
    pasos: [
      `1. Media: ${redondear(mediaVal)}`,
      `2. Diferencias al cuadrado: ${difCuad.map(d => redondear(d)).join(', ')}`,
      `3. Suma: ${redondear(suma(difCuad))}`,
      `4. varianza = ${redondear(suma(difCuad))} / ${n} = ${valor}`
    ],
    simbolos: [
      { simbolo_latex: '\\sigma^2', significado: 'Varianza poblacional' },
      { simbolo_latex: '\\bar{x}', significado: 'Media' }
    ]
  };
}

// ---- DESVIACIÓN ESTÁNDAR ----
export function desviacionEstandar(datos) {
  const v = varianza(datos);
  const valor = redondear(Math.sqrt(v.valor));
  return {
    estadistico: 'desviacion_estandar',
    valor,
    formula_latex: '\\sigma = \\sqrt{\\sigma^2}',
    formula_texto: 'desviación estándar = √(varianza)',
    datos_usados: datos,
    pasos: [
      `1. Varianza = ${v.valor}`,
      `2. desviación = √${v.valor} = ${valor}`
    ],
    simbolos: [{ simbolo_latex: '\\sigma', significado: 'Desviación estándar' }]
  };
}

// ---- COEFICIENTE DE VARIACIÓN ----
export function coeficienteVariacion(datos) {
  const mediaVal = suma(datos) / datos.length;
  const desv = desviacionEstandar(datos).valor;
  const valor = redondear((desv / mediaVal) * 100);
  return {
    estadistico: 'coeficiente_variacion',
    valor,
    formula_latex: 'CV = \\frac{\\sigma}{\\bar{x}} \\times 100',
    formula_texto: 'CV = (σ / media) × 100',
    datos_usados: datos,
    pasos: [
      `1. Media = ${redondear(mediaVal)}`,
      `2. Desviación estándar = ${desv}`,
      `3. CV = (${desv} / ${redondear(mediaVal)}) × 100 = ${valor}%`
    ],
    simbolos: [{ simbolo_latex: 'CV', significado: 'Coeficiente de variación' }]
  };
}
