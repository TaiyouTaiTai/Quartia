import { Link } from 'react-router';

// "Quartia" a lápiz con su subrayado de tinta. `tamano` en px.
export default function Logo({ tamano = 38, enlace = true }) {
  const contenido = (
    <>
      <span className="logo-texto" style={{ fontSize: tamano }}>Quartia</span>
      <svg width={tamano * 2.85} height="12" viewBox="0 0 240 12" preserveAspectRatio="none" aria-hidden="true">
        <path d="M3 8 C 60 3, 120 11, 237 5" stroke="var(--tinta)" strokeWidth="2.5" fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
    </>
  );
  return enlace
    ? <Link to="/" className="logo" aria-label="Quartia, ir al inicio">{contenido}</Link>
    : <span className="logo">{contenido}</span>;
}
