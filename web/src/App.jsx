import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { SesionProvider, RutaProtegida, SoloSinSesion } from './sesion/Sesion.jsx';
import Marco from './componentes/Marco.jsx';
import Login from './paginas/Login.jsx';
import Registro from './paginas/Registro.jsx';
import Inicio from './paginas/Inicio.jsx';
import NuevaTabla from './paginas/NuevaTabla.jsx';
// Las páginas con fórmulas (KaTeX) y gráficas (Recharts) pesan: se descargan
// solo cuando se abren, así el login y "Mis tablas" cargan rápido.
const Detalle = lazy(() => import('./paginas/Detalle.jsx'));
const EditarTabla = lazy(() => import('./paginas/EditarTabla.jsx'));
import NoEncontrada from './paginas/NoEncontrada.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <SesionProvider>
        <Suspense fallback={<p role="status" className="cargando">Cargando…</p>}>
          <Routes>
            <Route element={<SoloSinSesion />}>
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Registro />} />
            </Route>
            <Route element={<RutaProtegida />}>
              <Route element={<Marco />}>
                <Route index element={<Inicio />} />
                <Route path="/tablas/nueva" element={<NuevaTabla />} />
                <Route path="/tablas/:id" element={<Detalle />} />
                <Route path="/tablas/:id/editar" element={<EditarTabla />} />
                <Route path="*" element={<NoEncontrada />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </SesionProvider>
    </BrowserRouter>
  );
}
