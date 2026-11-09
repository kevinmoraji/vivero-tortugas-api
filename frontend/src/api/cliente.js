import axios from "axios";

import { leerSesionGuardada } from "./almacenamientoSesion";

export const URL_BASE_API = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";

export const clienteApi = axios.create({
  baseURL: URL_BASE_API,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

clienteApi.interceptors.request.use((configuracionSolicitud) => {
  const sesionGuardada = leerSesionGuardada();
  if (sesionGuardada?.token) {
    configuracionSolicitud.headers.Authorization = `Token ${sesionGuardada.token}`;
  }
  return configuracionSolicitud;
});

// Función que el contexto de autenticación registra para reaccionar al 401.
let manejadorSesionPerdida = null;

export function registrarManejadorSesionPerdida(funcionManejadora) {
  manejadorSesionPerdida = funcionManejadora;
}

clienteApi.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const esSolicitudDeLogin = error.config?.url?.includes("auth/login");
    if (error.response?.status === 401 && !esSolicitudDeLogin && manejadorSesionPerdida) {
      manejadorSesionPerdida();
    }
    return Promise.reject(error);
  },
);