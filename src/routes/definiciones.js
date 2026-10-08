import { Router } from 'express';
import pool from '../config/db.js';

const router = Router();

// GET /api/definiciones — catálogo didáctico de conceptos
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, nombre, descripcion, formula_latex, ejemplo FROM definicion_estadistico ORDER BY nombre'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/definiciones/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM definicion_estadistico WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Definición no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
