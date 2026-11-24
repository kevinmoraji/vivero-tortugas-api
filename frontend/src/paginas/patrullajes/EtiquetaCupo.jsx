export default function EtiquetaCupo({ turno }) {
  const cantidadAsignados = turno.asignaciones.length;
  const estaLleno = turno.cupo_disponible <= 0;
  return (
    <span className={`badge ${estaLleno ? "text-bg-danger" : "text-bg-success"}`}>
      {cantidadAsignados} / {turno.cupo_maximo}
      {estaLleno && " (lleno)"}
    </span>
  );
}