// Nombres para mostrar de los valores que guarda el backend.

export const ESCALAS = {
  nominal: {
    nombre: 'Nominal',
    explicacion: 'Categorías sin orden.',
    ejemplo: 'carrera, color, ciudad'
  },
  ordinal: {
    nombre: 'Ordinal',
    explicacion: 'Categorías con un orden, pero la distancia entre ellas no es exacta.',
    ejemplo: 'satisfacción 1 a 5, nivel educativo'
  },
  intervalo: {
    nombre: 'Intervalo',
    explicacion: 'Números con distancias exactas, pero sin un cero real.',
    ejemplo: 'temperatura en °C, año'
  },
  razon: {
    nombre: 'Razón',
    explicacion: 'Números con un cero real: el doble significa “el doble”.',
    ejemplo: 'nota, edad, precio, peso'
  }
};

export const TIPOS = {
  numerico: 'numérica',
  texto: 'texto',
  fecha: 'fecha',
  booleano: 'sí / no',
  mixto: 'mixta'
};

export const ORIGENES = {
  excel: 'Excel',
  csv: 'CSV',
  manual: 'Creada en Quartia'
};

export const fecha = (iso) =>
  new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });

export const plural = (n, uno, varios) => `${n.toLocaleString('es-GT')} ${n === 1 ? uno : varios}`;

// Guatemala usa punto decimal (como los pasos que arma el backend: "390 / 5")
const LOCALE = 'es-GT';

export const numero = (n, decimales = 2) =>
  n.toLocaleString(LOCALE, { maximumFractionDigits: decimales });

// Orden en que se agrupan los estadísticos en el panel de cálculo
export const CATEGORIAS = {
  tendencia_central: 'Tendencia central',
  dispersion: 'Dispersión',
  posicion: 'Posición',
  forma: 'Forma',
  frecuencia: 'Frecuencia',
  asociacion: 'Asociación'
};

// Estadísticos que necesitan un parámetro (cuál cuartil, decil o percentil)
export const PARAMETROS = {
  cuartil: { min: 1, max: 3, paso: 1, porDefecto: 1, etiqueta: 'Cuál cuartil' },
  decil: { min: 1, max: 9, paso: 1, porDefecto: 5, etiqueta: 'Cuál decil' },
  percentil: { min: 1, max: 99, paso: 'any', porDefecto: 50, etiqueta: 'Cuál percentil' }
};

export const fechaHora = (iso) =>
  new Date(iso).toLocaleString('es', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
