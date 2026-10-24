import dotenv from 'dotenv';
import { z } from 'zod';
import { fileURLToPath } from 'url';

dotenv.config();

// Valida las variables de entorno al arrancar: si falta algo, el servidor
// no levanta y dice exactamente qué falta (en vez de fallar a medio request).
const esquema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().min(1),
  CORS_ORIGIN: z.string().default(''),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_EXPIRES: z.string().default('7d'),
  MAX_FILE_MB: z.coerce.number().positive().default(5),
  MAX_FILAS: z.coerce.number().int().positive().default(50000),
  MAX_COLUMNAS: z.coerce.number().int().positive().default(200),
  // Cuántos proxies hay delante (1 en Railway/Render). Vacío = ninguno (desarrollo)
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  // Carpeta del frontend compilado que sirve Express
  WEB_DIST: z.string().default(fileURLToPath(new URL('../../web/dist', import.meta.url)))
}).refine(e => e.NODE_ENV !== 'production' || e.CORS_ORIGIN.trim() !== '', {
  // Sin CORS_ORIGIN se acepta cualquier origen: aceptable en desarrollo, nunca en producción
  path: ['CORS_ORIGIN'],
  message: 'en producción es obligatorio (dominio del frontend)'
});

const resultado = esquema.safeParse(process.env);
if (!resultado.success) {
  console.error('❌ Configuración inválida en .env:');
  for (const e of resultado.error.errors) console.error(`   - ${e.path.join('.')}: ${e.message}`);
  process.exit(1);
}

export const env = {
  ...resultado.data,
  CORS_ORIGIN: resultado.data.CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean)
};
