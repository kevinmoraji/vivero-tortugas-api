const CLAVE_SESION = "vivero_tortugas_sesion";

export function leerSesionGuardada() {
  try {
    const textoGuardado = localStorage.getItem(CLAVE_SESION);
    return textoGuardado ? JSON.parse(textoGuardado) : null;
  } catch {
    return null;
  }
}

export function guardarSesion(sesion) {
  localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
}

export function borrarSesion() {
  localStorage.removeItem(CLAVE_SESION);
}