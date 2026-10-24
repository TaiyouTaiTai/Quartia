import Logo from '../componentes/Logo.jsx';

// Diseño común de /login y /registro: presentación a la izquierda y el
// formulario en una hoja de papel roto a la derecha (mesa "Inicio de sesión").
export default function Acceso({ children }) {
  return (
    <div className="acceso">
      <main className="acceso-interior">
        <div className="acceso-texto">
          <Logo tamano={84} enlace={false} />
          <h1>Sube tus datos y entiende <em>cómo</em> salió cada resultado.</h1>
          <p className="lapiz">media, mediana, cuartiles, histogramas… paso a paso, como en tu cuaderno.</p>
        </div>
        <div className="acceso-tarjeta papel-sombra">
          <div className="papel-roto">{children}</div>
        </div>
      </main>
    </div>
  );
}
