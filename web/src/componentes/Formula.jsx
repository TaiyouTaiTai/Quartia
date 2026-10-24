import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Fórmula LaTeX con KaTeX. Si el LaTeX viniera mal escrito, KaTeX muestra el
// texto en rojo en vez de romper la página (throwOnError: false).
export default function Formula({ latex, bloque = false, className }) {
  const html = useMemo(
    () => katex.renderToString(String(latex), { displayMode: bloque, throwOnError: false, output: 'html' }),
    [latex, bloque]
  );
  // El contenido viene del catálogo y del backend propios, no de lo que escribe el usuario
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
