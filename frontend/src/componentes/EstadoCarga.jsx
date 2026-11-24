export default function EstadoCarga({ cargando, error, alReintentar, children }) {
  if (cargando) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-success" role="status" />
        <p className="text-muted mt-2">Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger d-flex justify-content-between align-items-center">
        <span>
          <i className="bi bi-exclamation-triangle me-2" />
          {error}
        </span>
        {alReintentar && (
          <button type="button" className="btn btn-outline-danger btn-sm" onClick={alReintentar}>
            Reintentar
          </button>
        )}
      </div>
    );
  }

  return children;
}