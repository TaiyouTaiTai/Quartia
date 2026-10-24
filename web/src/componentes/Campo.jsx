import { useId } from 'react';

// Etiqueta + input + ayuda/error, conectados para lectores de pantalla.
export default function Campo({ etiqueta, error, ayuda, ...input }) {
  const id = useId();
  const idNota = `${id}-nota`;
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      <input
        id={id}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error || ayuda ? idNota : undefined}
        {...input}
      />
      {error
        ? <p id={idNota} className="campo-error">{error}</p>
        : ayuda && <p id={idNota} className="campo-ayuda">{ayuda}</p>}
    </div>
  );
}
