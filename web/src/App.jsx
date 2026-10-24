import { BrowserRouter, Route, Routes } from 'react-router';
import { SesionProvider, RutaProtegida, SoloSinSesion } from './sesion/Sesion.jsx';
import Marco from './componentes/Marco.jsx';
import Login from './paginas/Login.jsx';
import Registro from './paginas/Registro.jsx';
import Inicio from './paginas/Inicio.jsx';
import NuevaTabla from './paginas/NuevaTabla.jsx';
import Detalle from './paginas/Detalle.jsx';
import NoEncontrada from './paginas/NoEncontrada.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <SesionProvider>
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
              <Route path="*" element={<NoEncontrada />} />
            </Route>
          </Route>
        </Routes>
      </SesionProvider>
    </BrowserRouter>
  );
}
