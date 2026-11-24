export default function VentanaFormulario({ visible, titulo, guardando = false, alGuardar, alCerrar, children }) {
  if (!visible) return null;

  const manejarEnvio = (evento) => {
    evento.preventDefault();
    alGuardar();
  };

  return (
    <>
      <div className="modal d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <form className="modal-content" onSubmit={manejarEnvio} noValidate>
            <div className="modal-header">
              <h5 className="modal-title">{titulo}</h5>
              <button type="button" className="btn-close" aria-label="Cerrar" onClick={alCerrar} />
            </div>
            <div className="modal-body">{children}</div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={alCerrar} disabled={guardando}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-success" disabled={guardando}>
                {guardando && <span className="spinner-border spinner-border-sm me-2" />}
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
      <div className="modal-backdrop show" />
    </>
  );
}