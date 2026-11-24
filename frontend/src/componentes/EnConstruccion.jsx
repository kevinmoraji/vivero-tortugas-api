export default function EnConstruccion({ titulo, responsable }) {
  return (
    <div className="text-center my-5">
      <h2>{titulo}</h2>
      <p className="text-muted">
        <i className="bi bi-cone-striped me-2" />
        Pantalla en construcción. Responsable: {responsable}
      </p>
    </div>
  );
}