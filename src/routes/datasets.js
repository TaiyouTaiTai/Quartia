import { Router } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import pool from '../config/db.js';
import { auth } from '../middlewares/auth.js';
import { parsearExcel, parsearJSON, guardarDataset } from '../services/ingest.service.js';

const router = Router();
const upload = multer({ dest: 'uploads/', limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/datasets/excel — subir archivo Excel
router.post('/excel', auth, upload.single('archivo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' });
    const { nombreHoja, encabezados, filas, sha256, tamanoBytes } = await parsearExcel(req.file.path, req.usuario.id);

    // Registrar archivo
    const [archivoResult] = await pool.execute(
      'INSERT INTO archivo (usuario_id, nombre_orig, ruta_storage, mime, tamano_bytes, sha256, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.usuario.id, req.file.originalname, req.file.path, req.file.mimetype, tamanoBytes, sha256, 'listo']
    );

    const datasetId = await guardarDataset(req.usuario.id, archivoResult.insertId, { nombreHoja, encabezados, filas });

    // Limpiar archivo temporal
    fs.unlink(req.file.path, () => {});

    res.status(201).json({ dataset_id: datasetId, n_filas: filas.length, n_columnas: encabezados.length });
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    next(err);
  }
});

// POST /api/datasets/pegado — datos pegados en JSON
router.post('/pegado', auth, async (req, res, next) => {
  try {
    const { datos } = req.body;
    const { nombreHoja, encabezados, filas } = parsearJSON(datos);

    const [archivoResult] = await pool.execute(
      "INSERT INTO archivo (usuario_id, nombre_orig, ruta_storage, mime, estado) VALUES (?, ?, ?, 'application/json', 'listo')",
      [req.usuario.id, 'datos_pegados', 'memoria', ]
    );

    const datasetId = await guardarDataset(req.usuario.id, archivoResult.insertId, { nombreHoja, encabezados, filas });
    res.status(201).json({ dataset_id: datasetId, n_filas: filas.length, n_columnas: encabezados.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/datasets — listar datasets del usuario
router.get('/', auth, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT d.id, d.titulo, d.n_filas, d.n_columnas, d.creado_en
       FROM dataset d
       JOIN archivo a ON d.archivo_id = a.id
       WHERE a.usuario_id = ? ORDER BY d.creado_en DESC`,
      [req.usuario.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/datasets/:id — obtener dataset completo con columnas y valores
router.get('/:id', auth, async (req, res, next) => {
  try {
    const [cols] = await pool.execute(
      `SELECT dc.id, dc.posicion, dc.nombre, dc.tipo_dato, dc.escala, dc.naturaleza, dc.n_validos, dc.n_nulos
       FROM dataset_columna dc
       JOIN dataset d ON dc.dataset_id = d.id
       JOIN archivo a ON d.archivo_id = a.id
       WHERE d.id = ? AND a.usuario_id = ? ORDER BY dc.posicion`,
      [req.params.id, req.usuario.id]
    );
    if (cols.length === 0) return res.status(404).json({ error: 'Dataset no encontrado' });

    // Obtener valores por columna
    const columnasCompletas = [];
    for (const col of cols) {
      const [valores] = await pool.execute(
        'SELECT fila_idx, valor_num, valor_txt, valor_fecha, es_nulo FROM dataset_valor WHERE columna_id = ? ORDER BY fila_idx',
        [col.id]
      );
      columnasCompletas.push({ ...col, valores });
    }
    res.json(columnasCompletas);
  } catch (err) {
    next(err);
  }
});

export default router;
