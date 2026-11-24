import { BrowserRouter, Route, Routes } from "react-router-dom";

import { ProveedorAvisos } from "./contextos/ContextoAvisos";
import { ProveedorSesion } from "./contextos/ContextoSesion";
import Layout from "./componentes/Layout";
import RutaProtegida from "./componentes/RutaProtegida";

import Login from "./paginas/Login";
import Dashboard from "./paginas/Dashboard";
import NoEncontrada from "./paginas/NoEncontrada";
import Playas from "./paginas/vivero/Playas";
import Sectores from "./paginas/vivero/Sectores";
import Turnos from "./paginas/patrullajes/Turnos";
import DetalleTurno from "./paginas/patrullajes/DetalleTurno";
import Voluntarios from "./paginas/voluntarios/Voluntarios";
import FormularioVoluntario from "./paginas/voluntarios/FormularioVoluntario";
import Nidos from "./paginas/nidos/Nidos";
import FormularioNido from "./paginas/nidos/FormularioNido";
import DetalleNido from "./paginas/nidos/DetalleNido";
import Eclosiones from "./paginas/nacimientos/Eclosiones";
import Liberaciones from "./paginas/nacimientos/Liberaciones";


export default function App() {
  return (
    <BrowserRouter>
      <ProveedorAvisos>
        <ProveedorSesion>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              element={
                <RutaProtegida>
                  <Layout />
                </RutaProtegida>
              }
            >
              <Route index element={<Dashboard />} />

              <Route path="playas" element={<Playas />} />
              <Route path="sectores" element={<Sectores />} />

              <Route path="turnos" element={<Turnos />} />
              <Route path="turnos/:id" element={<DetalleTurno />} />

              <Route path="voluntarios" element={<Voluntarios />} />
              <Route path="voluntarios/nuevo" element={<FormularioVoluntario />} />
              <Route path="voluntarios/:id/editar" element={<FormularioVoluntario />} />

              <Route path="nidos" element={<Nidos />} />
              <Route path="nidos/nuevo" element={<FormularioNido />} />
              <Route path="nidos/:id" element={<DetalleNido />} />
              <Route path="nidos/:id/editar" element={<FormularioNido />} />

              <Route path="eclosiones" element={<Eclosiones />} />
              <Route path="liberaciones" element={<Liberaciones />} />

              <Route path="*" element={<NoEncontrada />} />
            </Route>
          </Routes>
        </ProveedorSesion>
      </ProveedorAvisos>
    </BrowserRouter>
  );
}