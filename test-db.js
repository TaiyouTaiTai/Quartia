import pool from './src/config/db.js';

try {
  const [rows] = await pool.query('SELECT 1 AS ok');
  console.log('✅ Conexión a MySQL exitosa:', rows[0].ok);
} catch (err) {
  // Con ECONNREFUSED el mensaje viene vacío: el código es lo que dice qué pasó
  console.error('❌ Error de conexión:', err.code ?? '', err.message || '(¿está encendido MySQL?)');
  process.exitCode = 1;
} finally {
  await pool.end();
}
