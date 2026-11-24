import { clienteApi } from "./cliente";

function crearServicioRecurso(rutaRecurso) {
  return {
    listar: (parametros = {}) =>
      clienteApi.get(`/${rutaRecurso}/`, { params: limpiarParametros(parametros) }).then((respuesta) => respuesta.data),
    obtener: (identificador) =>
      clienteApi.get(`/${rutaRecurso}/${identificador}/`).then((respuesta) => respuesta.data),
    crear: (datos) => clienteApi.post(`/${rutaRecurso}/`, datos).then((respuesta) => respuesta.data),
    actualizar: (identificador, datos) =>
      clienteApi.put(`/${rutaRecurso}/${identificador}/`, datos).then((respuesta) => respuesta.data),
    eliminar: (identificador) => clienteApi.delete(`/${rutaRecurso}/${identificador}/`),
  };
}

function limpiarParametros(parametros) {
  return Object.fromEntries(
    Object.entries(parametros).filter(([, valor]) => valor !== "" && valor !== null && valor !== undefined),
  );
}

// ---------- Autenticación ----------
export const autenticacionApi = {
  iniciarSesion: (usuario, contrasena) =>
    clienteApi.post("/auth/login/", { username: usuario, password: contrasena }).then((respuesta) => respuesta.data),
  cerrarSesion: () => clienteApi.post("/auth/logout/"),
  perfil: () => clienteApi.get("/auth/me/").then((respuesta) => respuesta.data),
};

// ---------- Módulo 1 Vivero ----------
export const playasApi = crearServicioRecurso("playas");
export const sectoresApi = crearServicioRecurso("sectores");

// ---------- Módulo 2 Voluntarios ----------
export const voluntariosApi = crearServicioRecurso("voluntarios");

// ---------- Módulo 3 Patrullajes ----------
export const turnosApi = {
  ...crearServicioRecurso("turnos"),
  asignarVoluntario: (turnoId, voluntarioId, rol) =>
    clienteApi.post(`/turnos/${turnoId}/asignar/`, { voluntario: voluntarioId, rol }).then((respuesta) => respuesta.data),
  retirarVoluntario: (turnoId, voluntarioId) =>
    clienteApi.delete(`/turnos/${turnoId}/asignaciones/${voluntarioId}/`),
};

// ---------- Módulo 4 Nidos ----------
export const nidosApi = {
  ...crearServicioRecurso("nidos"),
  marcarPerdido: (nidoId, motivo) =>
    clienteApi.post(`/nidos/${nidoId}/marcar-perdido/`, { motivo }).then((respuesta) => respuesta.data),
};

// ---------- Módulo 5 Nacimientos ----------
export const eclosionesApi = crearServicioRecurso("eclosiones");
export const liberacionesApi = crearServicioRecurso("liberaciones");

// ---------- Reportes----------
export const reportesApi = {
  resumenPlayas: () => clienteApi.get("/reportes/resumen-playas/").then((respuesta) => respuesta.data),
  proximosAEclosionar: () => clienteApi.get("/reportes/proximos-a-eclosionar/").then((respuesta) => respuesta.data),
  ocupacionVivero: () => clienteApi.get("/reportes/ocupacion-vivero/").then((respuesta) => respuesta.data),
  liberacionesPorMes: (anio) =>
    clienteApi.get("/reportes/liberaciones-por-mes/", { params: anio ? { anio } : {} }).then((respuesta) => respuesta.data),
};

export function listarParaSelector(servicio, filtros = {}) {
  return servicio.listar({ ...filtros, page_size: 100 }).then((pagina) => pagina.results);
}