// Mensaje de error amable (rojo lápiz, nunca un grito).
export default function Alerta({ children }) {
  if (!children) return null;
  return (
    <p className="alerta" role="alert">
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M12 7v6M12 16.5v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span>{children}</span>
    </p>
  );
}
