import { redondear, ordenar, suma } from './helpers.js';

// ---- MEDIA ARITMÉTICA ----
export function media(datos) {
  const n = datos.length;
  const s = suma(datos);
  const valor = redondear(s / n);
  return {
    estadistico: 'media',
    valor,
    formula_latex: '\\bar{x} = \\frac{\\sum_{i=1}^{n} x_i}{n}',
    formula_texto: 'media = (Σxᵢ) / n',
    datos_usados: datos,
    pasos: [
      `1. Número de datos: n = ${n}`,
      `2. Suma de datos: ${datos.join(' + ')} = ${s}`,
      `3. media = ${s} / ${n} = ${valor}`
    ],
    simbolos: [
      { simbolo_latex: '\\bar{x}', significado: 'Media aritmética' },
      { simbolo_latex: 'x_i', significado: 'Cada dato' },
      { simbolo_latex: 'n', significado: 'Número de datos' }
    ]
  };
}

// ---- MEDIANA ----
export function mediana(datos) {
  const ordenados = ordenar(datos);
  const n = ordenados.length;
  let valor;
  let pasos;
  if (n % 2 === 1) {
    const pos = Math.floor(n / 2); // índice 0-based
    valor = redondear(ordenados[pos]);
    pasos = [
      `1. Ordenar datos: [${ordenados.join(', ')}]`,
      `2. n = ${n} es impar → posición = (n+1)/2 = ${(n+1)/2}`,
      `3. mediana = dato en posición ${(n+1)/2} = ${valor}`
    ];
  } else {
    const pos1 = n / 2 - 1;
    const pos2 = n / 2;
    const a = ordenados[pos1];
    const b = ordenados[pos2];
    valor = redondear((a + b) / 2);
    pasos = [
      `1. Ordenar datos: [${ordenados.join(', ')}]`,
      `2. n = ${n} es par → mediana = promedio de los datos en posición ${n/2} y ${n/2 + 1}`,
      `3. mediana = (${a} + ${b}) / 2 = ${valor}`
    ];
  }
  return {
    estadistico: 'mediana',
    valor,
    formula_latex: '\\tilde{x} = \\begin{cases} x_{(n+1)/2} & \\text{si } n \\text{ es impar} \\\\ \\frac{x_{n/2} + x_{n/2+1}}{2} & \\text{si } n \\text{ es par} \\end{cases}',
    formula_texto: 'mediana = dato central (impar) o promedio de los dos centrales (par)',
    datos_usados: datos,
    pasos,
    simbolos: [
      { simbolo_latex: '\\tilde{x}', significado: 'Mediana' },
      { simbolo_latex: 'x_{(n+1)/2}', significado: 'Dato en la posición central' }
    ]
  };
}

// ---- MODA ----
export function moda(datos) {
  const conteo = {};
  for (const d of datos) conteo[d] = (conteo[d] || 0) + 1;
  const maxFrec = Math.max(...Object.values(conteo));
  const modas = Object.keys(conteo).filter(k => conteo[k] === maxFrec);
  const valor = maxFrec === 1 ? null : modas.map(Number);
  return {
    estadistico: 'moda',
    valor,
    formula_latex: 'Mo = \\text{valor con mayor frecuencia}',
    formula_texto: 'moda = valor que más se repite',
    datos_usados: datos,
    pasos: [
      `1. Contar frecuencia de cada valor: ${Object.entries(conteo).map(([k,v]) => `${k}→${v}`).join(', ')}`,
      `2. Frecuencia máxima = ${maxFrec}`,
      maxFrec === 1
        ? '3. Todos los valores aparecen una vez → no hay moda'
        : `3. Moda = ${modas.join(', ')}`
    ],
    simbolos: [
      { simbolo_latex: 'Mo', significado: 'Moda' }
    ]
  };
}
