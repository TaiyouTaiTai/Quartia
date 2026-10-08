import { redondear, ordenar } from './helpers.js';
import { mediana } from './tendenciaCentral.js';



// ---- CUARTILES (método de posición) ----
export function cuartil(datos, q) {
  // q ∈ {1, 2, 3}
  const ordenados = ordenar(datos);
  const n = ordenados.length;
  const pos = (q * (n + 1)) / 4;
  const posInf = Math.floor(pos);
  const posSup = Math.ceil(pos);
  let valor;
  if (posInf === posSup) {
    valor = redondear(ordenados[posInf - 1]);
  } else {
    const fraccion = pos - posInf;
    const a = ordenados[posInf - 1];
    const b = ordenados[posSup - 1];
    valor = redondear(a + fraccion * (b - a));
  }
  return {
    estadistico: `cuartil_${q}`,
    valor,
    formula_latex: `Q_${q} = x_{\\frac{${q}(n+1)}{4}}`,
    formula_texto: `Cuartil ${q} = dato en posición ${q}(n+1)/4`,
    datos_usados: datos,
    pasos: [
      `1. Ordenar datos: [${ordenados.join(', ')}]`,
      `2. Posición = ${q}(n+1)/4 = ${q}(${n}+1)/4 = ${redondear(pos, 2)}`,
      `3. Q${q} = ${valor}`
    ],
    simbolos: [{ simbolo_latex: `Q_${q}`, significado: `Cuartil ${q}` }]
  };
}

// ---- PERCENTIL ----
export function percentil(datos, p) {
  const ordenados = ordenar(datos);
  const n = ordenados.length;
  const pos = (p * (n + 1)) / 100;
  const posInf = Math.floor(pos);
  const posSup = Math.ceil(pos);
  let valor;
  if (posInf === posSup) {
    valor = redondear(ordenados[posInf - 1]);
  } else {
    const fraccion = pos - posInf;
    valor = redondear(ordenados[posInf - 1] + fraccion * (ordenados[posSup - 1] - ordenados[posInf - 1]));
  }
  return {
    estadistico: `percentil_${p}`,
    valor,
    formula_latex: `P_${p} = x_{\\frac{${p}(n+1)}{100}}`,
    formula_texto: `Percentil ${p} = dato en posición ${p}(n+1)/100`,
    datos_usados: datos,
    pasos: [
      `1. Ordenar datos: [${ordenados.join(', ')}]`,
      `2. Posición = ${p}(n+1)/100 = ${p}(${n}+1)/100 = ${redondear(pos, 2)}`,
      `3. P${p} = ${valor}`
    ],
    simbolos: [{ simbolo_latex: `P_${p}`, significado: `Percentil ${p}` }]
  };
}

// ---- DECIL ----
export function decil(datos, d) {
  const ordenados = ordenar(datos);
  const n = ordenados.length;
  const pos = (d * (n + 1)) / 10;
  const posInf = Math.floor(pos);
  const posSup = Math.ceil(pos);
  let valor;
  if (posInf === posSup) {
    valor = redondear(ordenados[posInf - 1]);
  } else {
    const fraccion = pos - posInf;
    valor = redondear(ordenados[posInf - 1] + fraccion * (ordenados[posSup - 1] - ordenados[posInf - 1]));
  }
  return {
    estadistico: `decil_${d}`,
    valor,
    formula_latex: `D_${d} = x_{\\frac{${d}(n+1)}{10}}`
  };
}

// ---- RESUMEN DE CAJA (boxplot) ----
export function resumenCaja(datos) {
  const ordenados = ordenar(datos);
  const n = ordenados.length;
  const minimo = ordenados[0];
  const maximo = ordenados[n - 1];
  const med = mediana(datos).valor;
  const q1 = cuartil(datos, 1).valor;
  const q3 = cuartil(datos, 3).valor;
  const rangoIntercuartil = q3 - q1;
  const bigoteInf = Math.max(minimo, q1 - 1.5 * rangoIntercuartil);
  const bigoteSup = Math.min(maximo, q3 + 1.5 * rangoIntercuartil);
  return {
    minimo,
    q1,
    mediana: med,
    q3,
    maximo,
    rangoIntercuartil,
    bigoteInf,
    bigoteSup,
    datos_usados: datos,
    pasos: [
      `1. Ordenar datos: [${ordenados.join(', ')}]`,
      `2. Q1 = ${q1}, Mediana = ${med}, Q3 = ${q3}`,
      `3. Rango intercuartil (IQR) = Q3 - Q1 = ${q3} - ${q1} = ${rangoIntercuartil}`,
      `4. Bigote inferior = m├íx(m├¡n, Q1 - 1.5*IQR) = ${bigoteInf}`,
      `5. Bigote superior = m├¡n(m├íx, Q3 + 1.5*IQR) = ${bigoteSup}`
    ]
  };
}
