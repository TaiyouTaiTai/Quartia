import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db.js';

// Rutas
import authRoutes from './routes/auth.js';
import datasetRoutes from './routes/datasets.js';
import calculoRoutes from './routes/calculos.js';
import graficaRoutes from './routes/graficas.js';
import definicionRoutes from './routes/definiciones.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/calculos', calculoRoutes);
app.use('/api/graficas', graficaRoutes);
app.use('/api/definiciones', definicionRoutes);

// Ruta de salud (prueba rápida de que el server vive)
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    res.json({ ok: true, db: rows[0].ok === 1 });
  } catch (err) {
    res.status(500).json({ ok: false, db: false, error: err.message });
  }
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Error interno' });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🔌 Base de datos: ${process.env.DB_NAME || 'no configurada'}`);
});
