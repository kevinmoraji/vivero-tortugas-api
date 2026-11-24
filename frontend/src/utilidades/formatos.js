export function formatearFecha(textoFecha) {
  if (!textoFecha) return "—";
  const [anio, mes, dia] = textoFecha.slice(0, 10).split("-");
  return `${dia}/${mes}/${anio}`;
}

export function formatearFechaHora(textoFechaHora) {
  if (!textoFechaHora) return "—";
  return `${formatearFecha(textoFechaHora)} ${textoFechaHora.slice(11, 16)}`;
}

export function aValorFechaHoraLocal(textoFechaHora) {
  return textoFechaHora ? textoFechaHora.slice(0, 16) : "";
}

export function fechaDeHoy() {
  const hoy = new Date();
  const desfaseEnMinutos = hoy.getTimezoneOffset();
  return new Date(hoy.getTime() - desfaseEnMinutos * 60000).toISOString().slice(0, 10);
}

export const ESPECIES = [
  { valor: "LORA", texto: "Lora" },
  { valor: "BAULA", texto: "Baula" },
  { valor: "VERDE", texto: "Verde" },
  { valor: "CAREY", texto: "Carey" },
];

export const ESTADOS_NIDO = [
  { valor: "INCUBANDO", texto: "Incubando", color: "warning" },
  { valor: "ECLOSIONADO", texto: "Eclosionado", color: "success" },
  { valor: "PERDIDO", texto: "Perdido", color: "secondary" },
];

export const ROLES_EN_TURNO = [
  { valor: "PATRULLERO", texto: "Patrullero" },
  { valor: "LIDER", texto: "Líder de turno" },
];

export function textoDeOpcion(listaDeOpciones, valor) {
  return listaDeOpciones.find((opcion) => opcion.valor === valor)?.texto ?? valor;
}