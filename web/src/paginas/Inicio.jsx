import { useSesion } from '../sesion/Sesion.jsx';

// "Mis tablas". La lista, la subida de archivos y la tabla nueva llegan en la fase 2.
export default function Inicio() {
  const { usuario } = useSesion();
  return (
    <main className="pagina">
      <h1 style={{ fontSize: 36 }}>Hola, {usuario.nombre.split(' ')[0]}</h1>
      <p className="lapiz" style={{ fontSize: 28, margin: 0 }}>
        Todavía no tienes tablas. Muy pronto podrás subir un Excel o CSV aquí.
      </p>
    </main>
  );
}
