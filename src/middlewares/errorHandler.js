export function errorHandler(err, req, res, next) {
  console.error(err);
  
  // Error de validación de Zod
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Datos inválidos',
      detalles: err.errors.map(e => ({ campo: e.path.join('.'), mensaje: e.message }))
    });
  }

  // Error de multer (archivo)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'El archivo excede el tamaño máximo permitido' });
  }

  // Error de MySQL
  if (err.code?.startsWith('ER_')) {
    return res.status(500).json({ error: 'Error de base de datos', detalle: err.message });
  }

  res.status(500).json({ error: 'Error interno del servidor' });
}
