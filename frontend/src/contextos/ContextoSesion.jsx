import { createContext, useContext, useEffect, useState } from "react";

import { autenticacionApi } from "../api/servicios";
import { registrarManejadorSesionPerdida } from "../api/cliente";
import { borrarSesion, guardarSesion, leerSesionGuardada } from "../api/almacenamientoSesion";


const ContextoSesion = createContext(null);

export function ProveedorSesion({ children }) {
  const [sesion, setSesion] = useState(() => leerSesionGuardada());
  const [avisoDeSesion, setAvisoDeSesion] = useState("");


  useEffect(() => {
    registrarManejadorSesionPerdida(() => {
      borrarSesion();
      setSesion(null);
      setAvisoDeSesion("Su sesión expiró. Inicie sesión de nuevo.");
    });
    return () => registrarManejadorSesionPerdida(null);
  }, []);

  const iniciarSesion = async (nombreUsuario, contrasena) => {
    const respuestaLogin = await autenticacionApi.iniciarSesion(nombreUsuario, contrasena);
    guardarSesion(respuestaLogin);
    setSesion(respuestaLogin);
    setAvisoDeSesion("");
    return respuestaLogin;
  };

  const cerrarSesion = async () => {
    try {
      await autenticacionApi.cerrarSesion();
    } catch {
      
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
    avisoDeSesion,
  };

  return <ContextoSesion.Provider value={valorDelContexto}>{children}</ContextoSesion.Provider>;
}

export function useSesion() {
  return useContext(ContextoSesion);
}