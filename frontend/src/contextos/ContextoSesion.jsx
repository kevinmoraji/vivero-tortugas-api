import { createContext, useContext, useState } from "react";

import { autenticacionApi } from "../api/servicios";
import { borrarSesion, guardarSesion, leerSesionGuardada } from "../api/almacenamientoSesion";

const ContextoSesion = createContext(null);

export function ProveedorSesion({ children }) {
  const [sesion, setSesion] = useState(() => leerSesionGuardada());

  const iniciarSesion = async (nombreUsuario, contrasena) => {
    const respuestaLogin = await autenticacionApi.iniciarSesion(nombreUsuario, contrasena);
    guardarSesion(respuestaLogin);
    setSesion(respuestaLogin);
    return respuestaLogin;
  };

  const cerrarSesion = async () => {
    try {
      await autenticacionApi.cerrarSesion();
    } finally {
      borrarSesion();
      setSesion(null);
    }
  };

  const valorDelContexto = {
    usuario: sesion?.usuario ?? "",
    roles: sesion?.roles ?? [],
    haySesion: Boolean(sesion?.token),
    iniciarSesion,
    cerrarSesion,
  };

  return <ContextoSesion.Provider value={valorDelContexto}>{children}</ContextoSesion.Provider>;
}

export function useSesion() {
  return useContext(ContextoSesion);
}