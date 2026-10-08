import { Router } from 'express';
import pool from '../config/db.js';
import { auth } from '../middlewares/auth.js';
import { media, mediana, moda } from '../calculos/tendenciaCentral.js';
import { rango, varianza, desviacionEstandar, coeficienteVariacion } from '../calculos/variabilidad.js';
import { cuartil, percentil, decil, resumenCaja } from '../calculos/posicion.js';
import { generarClases, mediaAgrupada, medianaAgrupada, modaAgrupada } from '../calculos/agrupados.js';

const router = Router();

// POST /api/calculos
router.post('/', auth, async (req, res, next) => {
  try {
    const { dataset_id, columna_id, estadisticos = [], agrupado = false, parametros = {} } = req.body;

    // Verificar que el dataset pertenece al usuario
    const [ds] = await pool.execute(
      `SELECT d.id FROM dataset d JOIN archivo a ON d.archivo_id = a.id WHERE d.id = ? AND a.usuario_id = ?`,
      [dataset_id, req.usuario.id]
    );
    if (ds.length === 0) return res.status(404).json({ error: 'Dataset no encontrado' });

    // Obtener la columna
    const [cols] = await pool.execute(
      'SELECT id, nombre, tipo_dato FROM dataset_columna WHERE id = ? AND dataset_id = ?',
      [columna_id, dataset_id]
    );
    if (cols.length === 0) return res.status(404).json({ error: 'Columna no encontrada' });
    const columna = cols[0];

    // Solo columnas numéricas para estos cálculos
    if (columna.tipo_dato !== 'numerico') {
      return res.status(400).json({ error: 'La columna debe ser numérica para estos cálculos' });
    }

    // Obtener valores numéricos no nulos
    const [valores] = await pool.execute(
      'SELECT valor_num FROM dataset_valor WHERE columna_id = ? AND valor_num IS NOT NULL ORDER BY fila_idx',
      [columna_id]
    );
    const datos = valores.map(v => v.valor_num);
    if (datos.length === 0) return res.status(400).json({ error: 'La columna no tiene datos numéricos' });

    const resultados = {};

    // Si se pide agrupado, generar distribución primero
    let distribucion = null;
    if (agrupado) {
      distribucion = generarClases(datos, parametros.metodo_k || 'sturges');
      resultados.distribucion = distribucion;
    }

    for (const est of estadisticos) {
      switch (est) {
        case 'media':
          resultados.media = agrupado ? mediaAgrupada(distribucion) : media(datos);
          break;
        case 'mediana':
          resultados.mediana = agrupado ? medianaAgrupada(distribucion) : mediana(datos);
          break;
        case 'moda':
          resultados.moda = agrupado ? modaAgrupada(distribucion) : moda(datos);
          break;
        case 'rango':
          resultados.rango = rango(datos);
          break;
        case 'varianza':
          resultados.varianza = varianza(datos);
          break;
        case 'desviacion':
          resultados.desviacion = desviacionEstandar(datos);
          break;
        case 'cv':
          resultados.cv = coeficienteVariacion(datos);
          break;
        case 'cuartil':
          const q = parametros.q || 1;
          resultados[`cuartil_${q}`] = cuartil(datos, q);
          break;
        case 'percentil':
          const p = parametros.p || 50;
          resultados[`percentil_${p}`] = percentil(datos, p);
          break;
        case 'decil':
          const d = parametros.d || 5;
          resultados[`decil_${d}`] = decil(datos, d);
          break;
        case 'resumen_caja':
          resultados.resumen_caja = resumenCaja(datos);
          break;
        default:
          break;
      }
    }

    // Guardar en resultado_estadistico (opcional, para historial)
    // ... (lo puedes agregar si quieres persistencia)

    res.json(resultados);
  } catch (err) {
    next(err);
  }
});

export default router;
