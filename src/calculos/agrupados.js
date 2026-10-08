import { redondear, suma } from './helpers.js';

// ---- Generar distribución de frecuencias (Sturges) ----
export function generarClases(datos, metodoK = 'sturges') {
  const n = datos.length;
  let k;
  if (metodoK === 'sturges') k = Math.ceil(1 + 3.322 * Math.log10(n));
  else if (metodoK === 'raiz') k = Math.ceil(Math.sqrt(n));
  else if (metodoK === 'scott') k = Math.ceil((Math.max(...datos) - Math.min(...datos)) / (3.5 * desviacionEstandar(datos).valor / Math.sqrt(n)));
  else k = 5; // manual por defecto

  const min = Math.min(...datos);
  const max = Math.max(...datos);
  const rango = max - min;
  const ancho = Math.ceil(rango / k * 100) / 100; // redondeo hacia arriba a 2 decimales

  const clases = [];
  let limInf = min;
  for (let i = 0; i < k; i++) {
    const limSup = limInf + ancho;
    const fi = datos.filter(d => d >= limInf && (i === k - 1 ? d <= limSup : d < limSup)).length;
    clases.push({
      orden: i + 1,
      lim_inf: redondear(limInf),
      lim_sup: redondear(limSup),
      marca_clase: redondear((limInf + limSup) / 2),
      fi
    });
    limInf = limSup;
  }

  // Frecuencias acumuladas y relativas
  let fiAcum = 0, hiAcum = 0;
  for (const c of clases) {
    fiAcum += c.fi;
    hiAcum += c.fi / n;
    c.fi_acum = fiAcum;
    c.hi = redondear(c.fi / n);
    c.hi_acum = redondear(hiAcum);
  }

  return { k, ancho, rango, min, max, n_total: n, clases };
}

// ---- MEDIA EN DATOS AGRUPADOS ----
export function mediaAgrupada(distribucion) {
  const { clases, n_total } = distribucion;
  const sumMarcas = suma(clases.map(c => c.marca_clase * c.fi));
  const valor = redondear(sumMarcas / n_total);
  return {
    estadistico: 'media_agrupada',
    valor,
    formula_latex: '\\bar{x} = \\frac{\\sum (m_i \\cdot f_i)}{n}',
    formula_texto: 'media agrupada = Σ(marca_clase × fi) / n',
    datos_usados: clases.map(c => ({ marca: c.marca_clase, fi: c.fi })),
    pasos: [
      `1. Calcular marca de clase de cada clase`,
      `2. Productos: ${clases.map(c => `${c.marca_clase}×${c.fi}=${redondear(c.marca_clase * c.fi)}`).join(', ')}`,
      `3. Suma de productos = ${redondear(sumMarcas)}`,
      `4. media = ${redondear(sumMarcas)} / ${n_total} = ${valor}`
    ],
    simbolos: [
      { simbolo_latex: 'm_i', significado: 'Marca de clase' },
      { simbolo_latex: 'f_i', significado: 'Frecuencia de la clase' }
    ]
  };
}

// ---- MEDIANA EN DATOS AGRUPADOS ----
export function medianaAgrupada(distribucion) {
  const { clases, n_total, ancho } = distribucion;
  const nMedio = n_total / 2;
  // Encontrar clase donde fi_acum >= nMedio
  let claseMediana = null;
  let fiAcumAnterior = 0;
  for (const c of clases) {
    if (c.fi_acum >= nMedio) {
      claseMediana = c;
      break;
    }
    fiAcumAnterior = c.fi_acum;
  }
  if (!claseMediana) return null;
  const valor = redondear(
    claseMediana.lim_inf + ((nMedio - fiAcumAnterior) / claseMediana.fi) * ancho
  );
  return {
    estadistico: 'mediana_agrupada',
    valor,
    formula_latex: 'Me = L_i + \\frac{\\frac{n}{2} - F_{i-1}}{f_i} \\cdot a',
    formula_texto: 'mediana agrupada = Li + ((n/2 - F_anterior) / fi) × ancho',
    datos_usados: { claseMediana, fiAcumAnterior, n_total, ancho },
    pasos: [
      `1. n/2 = ${n_total}/2 = ${nMedio}`,
      `2. Clase mediana: [${claseMediana.lim_inf}, ${claseMediana.lim_sup}) con fi = ${claseMediana.fi}`,
      `3. Frecuencia acumulada anterior = ${fiAcumAnterior}`,
      `4. mediana = ${claseMediana.lim_inf} + ((${nMedio} - ${fiAcumAnterior}) / ${claseMediana.fi}) × ${ancho} = ${valor}`
    ],
    simbolos: [
      { simbolo_latex: 'L_i', significado: 'Límite inferior de la clase mediana' },
      { simbolo_latex: 'F_{i-1}', significado: 'Frecuencia acumulada anterior' },
      { simbolo_latex: 'f_i', significado: 'Frecuencia de la clase mediana' },
      { simbolo_latex: 'a', significado: 'Ancho de clase' }
    ]
  };
}

// ---- MODA EN DATOS AGRUPADOS ----
export function modaAgrupada(distribucion) {
  const { clases, ancho } = distribucion;
  // Clase con mayor frecuencia
  let maxFi = 0, claseModal = null, indexModal = 0;
  clases.forEach((c, i) => {
    if (c.fi > maxFi) { maxFi = c.fi; claseModal = c; indexModal = i; }
  });
  if (!claseModal) return null;

  const fAnterior = indexModal > 0 ? clases[indexModal - 1].fi : 0;
  const fSiguiente = indexModal < clases.length - 1 ? clases[indexModal + 1].fi : 0;
  const d1 = claseModal.fi - fAnterior;
  const d2 = claseModal.fi - fSiguiente;
  const valor = redondear(claseModal.lim_inf + (d1 / (d1 + d2)) * ancho);

  return {
    estadistico: 'moda_agrupada',
    valor,
    formula_latex: 'Mo = L_i + \\frac{d_1}{d_1 + d_2} \\cdot a',
    formula_texto: 'moda agrupada = Li + (d1 / (d1 + d2)) × ancho',
    datos_usados: { claseModal, fAnterior, fSiguiente, ancho },
    pasos: [
      `1. Clase modal (mayor fi): [${claseModal.lim_inf}, ${claseModal.lim_sup}) con fi = ${claseModal.fi}`,
      `2. d1 = fi_modal - fi_anterior = ${claseModal.fi} - ${fAnterior} = ${d1}`,
      `3. d2 = fi_modal - fi_siguiente = ${claseModal.fi} - ${fSiguiente} = ${d2}`,
      `4. moda = ${claseModal.lim_inf} + (${d1} / (${d1} + ${d2})) × ${ancho} = ${valor}`
    ],
    simbolos: [
      { simbolo_latex: 'L_i', significado: 'Límite inferior de la clase modal' },
      { simbolo_latex: 'd_1', significado: 'Diferencia con frecuencia anterior' },
      { simbolo_latex: 'd_2', significado: 'Diferencia con frecuencia siguiente' }
    ]
  };
}
