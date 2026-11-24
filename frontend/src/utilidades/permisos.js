
const ADMINISTRADOR = "Administrador";
const COORDINADOR = "Coordinador";

const MODULOS_SOLO_DEL_ADMINISTRADOR = ["playas", "sectores"];

function tieneAlgunRol(roles, rolesPermitidos) {
  return roles.some((rol) => rolesPermitidos.includes(rol));
}

function rolesQueEscriben(modulo) {
  return MODULOS_SOLO_DEL_ADMINISTRADOR.includes(modulo) ? [ADMINISTRADOR] : [ADMINISTRADOR, COORDINADOR];
}

export function puedeCrear(roles, modulo) {
  return tieneAlgunRol(roles, rolesQueEscriben(modulo));
}

export function puedeEditar(roles, modulo) {
  return tieneAlgunRol(roles, rolesQueEscriben(modulo));
}

export function puedeEliminar(roles, modulo) {
  return Boolean(modulo) && tieneAlgunRol(roles, [ADMINISTRADOR]);
}