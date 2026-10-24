import { useEffect, useState } from 'react';

// Fase 0: solo comprueba que el frontend habla con la API.
// En la fase 1 esto se reemplaza por el router (login, mis tablas…).
export default function App() {
  const [estado, setEstado] = useState('cargando');

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(d => setEstado(d.ok ? 'ok' : 'sin-db'))
      .catch(() => setEstado('sin-api'));
  }, []);

  const mensajes = {
    cargando: 'Conectando con la API…',
    ok: 'API y base de datos funcionando.',
    'sin-db': 'La API responde, pero la base de datos no.',
    'sin-api': 'No se pudo contactar a la API. ¿Está corriendo `npm run dev`?'
  };

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '96px 32px' }}>
      <p className="lapiz" style={{ fontSize: 84, fontWeight: 600, lineHeight: 1, margin: 0 }}>Quartia</p>
      <svg width="240" height="12" viewBox="0 0 240 12" aria-hidden="true">
        <path d="M3 8 C 60 3, 120 11, 237 5" stroke="var(--tinta)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </svg>
      <h1 style={{ fontWeight: 400, fontSize: 32, marginTop: 24 }}>
        Sube tus datos y entiende <em>cómo</em> salió cada resultado.
      </h1>
      <p role="status" className="secundario" style={{ marginTop: 24 }}>{mensajes[estado]}</p>
    </main>
  );
}
