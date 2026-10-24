import { Link } from 'react-router';
import { useTitulo } from '../api/hooks.js';

export default function NoEncontrada() {
  useTitulo('Página no encontrada');
  return (
    <main className="pagina" style={{ alignItems: 'flex-start' }}>
      <h1 style={{ fontSize: 36 }}>Esta página no existe</h1>
      <p className="lapiz" style={{ fontSize: 28, margin: 0 }}>Quizá el enlace cambió o se escribió mal.</p>
      <Link to="/" className="boton">Volver al inicio</Link>
    </main>
  );
}
