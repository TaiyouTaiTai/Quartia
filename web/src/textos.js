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

export const plural = (n, uno, varios) => `${n.toLocaleString('es')} ${n === 1 ? uno : varios}`;
