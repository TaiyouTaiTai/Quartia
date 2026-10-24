import { useNavigate, useParams } from 'react-router';
import { useCargar } from '../api/hooks.js';
import * as datasets from '../api/datasets.js';
import * as analisisApi from '../api/analisis.js';
import Alerta from '../componentes/Alerta.jsx';
import { EditorTabla } from './NuevaTabla.jsx';
import NoEncontrada from './NoEncontrada.jsx';

// Editar los datos de una tabla existente (PUT: reemplaza todos los datos).
// Avisa antes si hay análisis guardados, porque el backend los borra.
export default function EditarTabla() {
  const { id } = useParams();
  const navegar = useNavigate();
  const { datos, error, cargando } = useCargar(
    () => Promise.all([datasets.obtener(id), analisisApi.listar(id)]).then(([tabla, analisis]) => ({ tabla, analisis })),
    [id]
  );

  if (error?.status === 404 || error?.status === 400) return <NoEncontrada />;
  if (error) return <main className="pagina"><Alerta>{error.message}</Alerta></main>;
  if (cargando) return <p role="status" className="cargando">Abriendo tu tabla…</p>;

  const { tabla, analisis } = datos;
  if (tabla.n_filas > 1000) {
    return (
      <main className="pagina">
        <Alerta>Esta tabla es muy grande para editarla aquí. Corrige el archivo y súbelo de nuevo.</Alerta>
      </main>
    );
  }

  const n = analisis.length;
  return (
    <EditorTabla
      titulo="Editar datos"
      migas={tabla.titulo}
      cancelarA={`/tablas/${tabla.id}`}
      inicial={{ titulo: tabla.titulo, columnas: tabla.datos.columnas, filas: tabla.datos.filas }}
      textoBoton={n ? 'Guardar y borrar los análisis' : 'Guardar cambios'}
      aviso={n === 0 ? null : `Al guardar se ${n === 1 ? 'borrará el análisis guardado' : `borrarán los ${n} análisis guardados`} de esta tabla, porque ya no corresponderían a los datos nuevos.`}
      alGuardar={async (nueva) => {
        await datasets.reemplazar(tabla.id, nueva);
        navegar(`/tablas/${tabla.id}`, { state: { editada: true } });
      }}
    />
  );
}
