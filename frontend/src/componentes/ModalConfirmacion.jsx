export default function ModalConfirmacion({
  visible,
  titulo = "Confirmar",
  mensaje,
  textoConfirmar = "Eliminar",
  procesando = false,
  alConfirmar,
  alCancelar,
}) {
  if (!visible) return null;

  return (
    <>
      <div className="modal d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{titulo}</h5>
              <button type="button" className="btn-close" aria-label="Cerrar" onClick={alCancelar} />
            </div>
            <div className="modal-body">
              <p className="mb-0">{mensaje}</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={alCancelar} disabled={procesando}>
                Cancelar
              </button>
              <button type="button" className="btn btn-danger" onClick={alConfirmar} disabled={procesando}>
                {procesando && <span className="spinner-border spinner-border-sm me-2" />}
                {textoConfirmar}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show" />
    </>
  );
}