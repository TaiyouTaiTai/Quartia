import pool from './src/config/db.js';

try {
  const [rows] = await pool.query('SELECT 1 AS ok');
  console.log('✅ Conexión a MySQL exitosa:', rows[0].ok);
  await pool.end();
} catch (err) {
  console.error('❌ Error de conexión:', err.message);
}
