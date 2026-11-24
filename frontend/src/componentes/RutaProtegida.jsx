import { Navigate, useLocation } from "react-router-dom";

import { useSesion } from "../contextos/ContextoSesion";

export default function RutaProtegida({ children }) {
  const { haySesion } = useSesion();
  const ubicacion = useLocation();

  if (!haySesion) {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
  }
  return children;
}