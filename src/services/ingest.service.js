import ExcelJS from 'exceljs';
import crypto from 'crypto';
import pool from '../config/db.js';

// ---- Detección de tipo de dato por columna ----
function detectarTipoColumna(valores) {
  let numericos = 0, textos = 0, fechas = 0, booleanos = 0, nulos = 0;
  for (const v of valores) {
    if (v === null || v === undefined || v === '') { nulos++; continue; }
    if (typeof v === 'boolean') booleanos++;
    else if (typeof v === 'number') numericos++;
    else if (v instanceof Date || (!isNaN(Date.parse(v)) && !isNaN(Number(v)) === false && /^\d{4}-\d{2}-\d{2}/.test(v))) fechas++;
    else if (!isNaN(Number(v))) numericos++;
    else textos++;
  }
  const total = numericos + textos + fechas + booleanos;
  if (total === 0) return 'mixto';
  const pctNum = numericos / total;
  if (pctNum >= 0.9) return 'numerico';
  if (fechas / total >= 0.9) return 'fecha';
  if (booleanos / total >= 0.9) return 'booleano';
  if (textos / total >= 0.9) return 'texto';
  return 'mixto';
}

// ---- Detección de escala (nominal, ordinal, intervalo, razón) ----
function detectarEscala(tipo, valores) {
  if (tipo === 'texto' || tipo === 'booleano') return 'nominal';
  if (tipo === 'fecha') return 'intervalo';
  // numérico: si hay valores negativos o cero → intervalo; si solo positivos → razón
  const numericos = valores.filter(v => typeof v === 'number' || (!isNaN(Number(v)) && v !== ''));
  if (numericos.length === 0) return 'nominal';
  const tieneCero = numericos.some(v => Number(v) === 0);
  const tieneNegativo = numericos.some(v => Number(v) < 0);
  if (tieneNegativo) return 'intervalo';
  if (tieneCero) return 'razon';
  return 'razon'; // valores positivos sin cero → ordinal o razón; asumimos razón
}

// ---- Detección de naturaleza (discreta/continua) ----
function detectarNaturaleza(valores) {
  const numericos = valores.filter(v => typeof v === 'number' || (!isNaN(Number(v)) && v !== '')).map(Number);
  if (numericos.length === 0) return 'na';
  const enteros = numericos.filter(v => Number.isInteger(v)).length;
  return enteros / numericos.length >= 0.95 ? 'discreta' : 'continua';
}

// ---- Normalizar un valor según tipo detectado ----
function normalizarValor(v, tipo) {
  if (v === null || v === undefined || v === '') return { es_nulo: true, valor_num: null, valor_txt: null, valor_fecha: null };
  if (tipo === 'numerico') {
    const n = Number(v);
    return { es_nulo: false, valor_num: isNaN(n) ? null : n, valor_txt: null, valor_fecha: null };
  }
  if (tipo === 'fecha') {
    const d = new Date(v);
    return { es_nulo: false, valor_num: null, valor_txt: null, valor_fecha: isNaN(d) ? null : d.toISOString().slice(0,10) };
  }
  if (tipo === 'booleano') {
    return { es_nulo: false, valor_num: null, valor_txt: String(v), valor_fecha: null };
  }
  // texto o mixto
  return { es_nulo: false, valor_num: null, valor_txt: String(v), valor_fecha: null };
}

// ---- Parsear Excel ----
export async function parsearExcel(archivo, usuarioId) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(archivo);
  const hoja = workbook.worksheets[0];
  const filaEncabezado = 1;

  // Leer encabezados
  const encabezados = [];
  const fila0 = hoja.getRow(filaEncabezado);
  fila0.eachCell({ includeEmpty: false }, (cell, colNum) => {
    encabezados[colNum - 1] = cell.value?.toString() || `Columna ${colNum}`;
  });

  // Leer todas las filas de datos
  const filas = [];
  hoja.eachRow((row, rowNum) => {
    if (rowNum <= filaEncabezado) return;
    const fila = [];
    for (let c = 0; c < encabezados.length; c++) {
      const cell = row.getCell(c + 1);
      fila.push(cell.value);
    }
    // Solo guardar filas con al menos un valor no nulo
    if (fila.some(v => v !== null && v !== undefined && v !== '')) {
      filas.push(fila);
    }
  });

  // Calcular SHA256 del archivo
  const fs = await import('fs');
  const buffer = fs.readFileSync(archivo);
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

  return { nombreHoja: hoja.name, encabezados, filas, sha256, tamanoBytes: buffer.length };
}

// ---- Recibir datos pegados (JSON) ----
export function parsearJSON(datos) {
  if (!Array.isArray(datos) || datos.length === 0) {
    throw new Error('Los datos pegados deben ser un array no vacío');
  }
  // Si es array de objetos → encabezados = claves
  if (typeof datos[0] === 'object' && !Array.isArray(datos[0])) {
    const encabezados = Object.keys(datos[0]);
    const filas = datos.map(obj => encabezados.map(k => obj[k]));
    return { nombreHoja: 'datos_pegados', encabezados, filas };
  }
  // Si es array de arrays → primera fila como encabezado
  const encabezados = datos[0].map((v, i) => v?.toString() || `Columna ${i + 1}`);
  const filas = datos.slice(1);
  return { nombreHoja: 'datos_pegados', encabezados, filas };
}

// ---- Persistir dataset en la base ----
export async function guardarDataset(usuarioId, archivoId, { nombreHoja, encabezados, filas }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Insertar dataset
    const [dsResult] = await conn.execute(
      'INSERT INTO dataset (archivo_id, nombre_hoja, titulo, fila_encabezado, n_filas, n_columnas) VALUES (?, ?, ?, 1, ?, ?)',
      [archivoId, nombreHoja, nombreHoja, filas.length, encabezados.length]
    );
    const datasetId = dsResult.insertId;

    // 2. Insertar columnas
    const columnas = {};
    for (let c = 0; c < encabezados.length; c++) {
      const valores = filas.map(f => f[c]);
      const tipo = detectarTipoColumna(valores);
      const escala = detectarEscala(tipo, valores);
      const naturaleza = detectarNaturaleza(valores);
      const nValid = valores.filter(v => v !== null && v !== undefined && v !== '').length;
      const [colResult] = await conn.execute(
        'INSERT INTO dataset_columna (dataset_id, posicion, nombre, tipo_dato, escala, naturaleza, n_validos, n_nulos) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [datasetId, c + 1, encabezados[c], tipo, escala, naturaleza, nValid, filas.length - nValid]
      );
      columnas[c] = colResult.insertId;
    }

    // 3. Insertar valores
    for (let r = 0; r < filas.length; r++) {
      for (let c = 0; c < encabezados.length; c++) {
        const { es_nulo, valor_num, valor_txt, valor_fecha } = normalizarValor(filas[r][c], 'numerico');
        await conn.execute(
          'INSERT INTO dataset_valor (dataset_id, columna_id, fila_idx, valor_num, valor_txt, valor_fecha, es_nulo) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [datasetId, columnas[c], r, valor_num, valor_txt, valor_fecha, es_nulo]
        );
      }
    }

    await conn.commit();
    return datasetId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
