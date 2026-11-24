import { ESTADOS_NIDO } from "../../utilidades/formatos";

export default function EtiquetaEstadoNido({ estado }) {
  const estadoEncontrado = ESTADOS_NIDO.find((opcion) => opcion.valor === estado);
  return (
    <span className={`badge text-bg-${estadoEncontrado?.color ?? "light"}`}>{estadoEncontrado?.texto ?? estado}</span>
  );
}