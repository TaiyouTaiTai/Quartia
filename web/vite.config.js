import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En desarrollo, Vite (puerto 5173) le pasa a Express todo lo que empiece con /api.
// Para el navegador es el mismo origen, así que CORS no interviene.
// Si el backend corre en otro puerto: API_URL=http://localhost:4000 npm run dev
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': process.env.API_URL ?? 'http://localhost:3000'
    }
  }
});
