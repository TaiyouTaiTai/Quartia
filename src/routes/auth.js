import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import pool from '../config/db.js';
import { auth } from '../middlewares/auth.js';

const router = Router();

const registroSchema = z.object({
  correo: z.string().email(),
  nombre: z.string().min(2).max(120),
  clave: z.string().min(6).max(100)
});

const loginSchema = z.object({
  correo: z.string().email(),
  clave: z.string().min(1)
});

// POST /api/auth/registro
router.post('/registro', async (req, res, next) => {
  try {
    const datos = registroSchema.parse(req.body);
    const hash = await bcrypt.hash(datos.clave, 10);
    const [result] = await pool.execute(
      'INSERT INTO usuario (correo, nombre, hash_clave) VALUES (?, ?, ?)',
      [datos.correo, datos.nombre, hash]
    );
    const token = jwt.sign(
      { id: result.insertId, correo: datos.correo },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );
    res.status(201).json({ token, usuario: { id: result.insertId, correo: datos.correo, nombre: datos.nombre } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ese correo ya está registrado' });
    }
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const datos = loginSchema.parse(req.body);
    const [rows] = await pool.execute(
      'SELECT id, correo, nombre, hash_clave FROM usuario WHERE correo = ?',
      [datos.correo]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const usuario = rows[0];
    const valido = await bcrypt.compare(datos.clave, usuario.hash_clave);
    if (!valido) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const token = jwt.sign(
      { id: usuario.id, correo: usuario.correo },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );
    res.json({ token, usuario: { id: usuario.id, correo: usuario.correo, nombre: usuario.nombre } });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, correo, nombre, creado_en FROM usuario WHERE id = ?',
      [req.usuario.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
