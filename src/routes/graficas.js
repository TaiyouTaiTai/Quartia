import { Router } from 'express';
import pool from '../config/db.js';
import { auth } from '../middlewares/auth.js';
import { generarClases } from '../calculos/agrupados.js';
import { resumenCaja } from '../calculos/posicion.js';
import { puntosHistograma, puntosPoligono, puntosOjiva } from '../graficas/histograma.js';
import { puntosCaja } from '../graficas/caja.js';
import { puntosBarras } from '../graficas/barras.js';

const router = Router();

// POST /api/graficas/:tipo
router.post('/:tipo', auth, async (req, res, next) => {
  try {
    const { tipo } = req.params;
    const { dataset_id, columna_id, columna_b_id } = req.body;

    // Verificar propiedad
    const [ds] = await pool.execute(
      `SELECT d.id FROM dataset d JOIN archivo a ON d.archivo_id = a.id WHERE d.id = ? AND a.usuario_id = ?`,
      [dataset_id, req.usuario.id]
    );
    if (ds.length === 0) return res.status(404).json({ error: 'Dataset no encontrado' });

    const [cols] = await pool.execute(
      'SELECT id, nombre, tipo_dato FROM dataset_columna WHERE id = ? AND dataset_id = ?',
      [columna_id, dataset_id]
    );
    if (cols.length === 0) return res.status(404).json({ error: 'Columna no encontrada' });
    const columna = cols[0];

    // Obtener valores
    const [valores] = await pool.execute(
      'SELECT valor_num, valor_txt FROM dataset_valor WHERE columna_id = ? AND es_nulo = FALSE ORDER BY fila_idx',
      [columna_id]
    );

    let resultado;

    switch (tipo) {
      case 'histograma':
      case 'poligono':
      case 'ojiva': {
        if (columna.tipo_dato !== 'numerico') {
          return res.status(400).json({ error: 'Estas gráficas requieren columna numérica' });
        }
        const datos = valores.map(v => v.valor_num).filter(v => v !== null);
        const distribucion = generarClases(datos);
        resultado = tipo === 'histograma'
          ? puntosHistograma(distribucion)
          : tipo === 'poligono'
            ? puntosPoligono(distribucion)
            : puntosOjiva(distribucion);
        break;
      }
      case 'caja': {
        if (columna.tipo_dato !== 'numerico') {
          return res.status(400).json({ error: 'La gráfica de caja requiere columna numérica' });
        }
        const datos = valores.map(v => v.valor_num).filter(v => v !== null);
        const resumen = resumenCaja(datos);
        resultado = puntosCaja(resumen);
        break;
      }
      case 'barras': {
        const datos = valores.map(v => v.valor_txt || v.valor_num).filter(v => v !== null);
        resultado = puntosBarras(datos);
        break;
      }
      case 'dispersion': {
        if (!columna_b_id) return res.status(400).json({ error: 'Se necesita columna_b_id para dispersión' });
        const [colsB] = await pool.execute(
          'SELECT id, nombre FROM dataset_columna WHERE id = ? AND dataset_id = ?',
          [columna_b_id, dataset_id]
        );
        if (colsB.length === 0) return res.status(404).json({ error: 'Columna B no encontrada' });
        const [valoresB] = await pool.execute(
          'SELECT fila_idx, valor_num FROM dataset_valor WHERE columna_id = ? AND valor_num IS NOT NULL',
          [columna_b_id]
        );
        const mapaB = new Map(valoresB.map(v => [v.fila_idx, v.valor_num]));
        const puntos = valores
          .map(v => ({ x: v.valor_num, y: mapaB.get(v.fila_idx) }))
          .filter(p => p.x !== null && p.y !== null);
        resultado = { tipo: 'dispersion', datos: puntos, config: { x_axis: columna.nombre, y_axis: colsB[0].nombre } };
        break;
      }
      default:
        return res.status(400).json({ error: 'Tipo de gráfica no soportado' });
    }

    res.json(resultado);
  } catch (err) {
    next(err);
  }
});

export default router;
