const REGISTROS_POR_PAGINA = 10;

export default function Paginacion({ paginaActual, totalRegistros, alCambiarPagina }) {
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / REGISTROS_POR_PAGINA));
  if (totalPaginas <= 1) return null;

  return (
    <nav className="d-flex justify-content-between align-items-center">
      <small className="text-muted">
        Página {paginaActual} de {totalPaginas} ({totalRegistros} registros)
      </small>
      <div className="btn-group">
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          disabled={paginaActual <= 1}
          onClick={() => alCambiarPagina(paginaActual - 1)}
        >
          <i className="bi bi-chevron-left" /> Anterior
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          disabled={paginaActual >= totalPaginas}
          onClick={() => alCambiarPagina(paginaActual + 1)}
        >
          Siguiente <i className="bi bi-chevron-right" />
        </button>
      </div>
    </nav>
  );
}