import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En desarrollo, Vite (puerto 5173) le pasa a Express todo lo que empiece con /api.
// Para el navegador es el mismo origen, así que CORS no interviene.
// Si el backend corre en otro puerto: API_URL=http://localhost:4000 npm run dev
export default defineConfig({
  plugins: [react()],
  build: {
    // La página de una tabla trae KaTeX y Recharts (~700 kB, ~200 kB comprimidos).
    // Se descarga aparte, solo al abrir una tabla (ver lazy() en App.jsx).
    chunkSizeWarningLimit: 800
  },
  server: {
    port: 5173,
    proxy: {
      '/api': process.env.API_URL ?? 'http://localhost:3000'
    }
  }
});
