export default function CampoFormulario({
  etiqueta,
  nombre,
  valor,
  alCambiar,
  error = "",
  tipo = "text",
  opciones = null,
  requerido = false,
  ...otrasPropiedades
}) {
  const claseDelControl = opciones ? "form-select" : "form-control";
  const claseConError = error ? `${claseDelControl} is-invalid` : claseDelControl;

  return (
    <div className="mb-3">
      <label htmlFor={nombre} className="form-label">
        {etiqueta}
        {requerido && <span className="text-danger"> *</span>}
      </label>

      {opciones ? (
        <select
          id={nombre}
          name={nombre}
          className={claseConError}
          value={valor ?? ""}
          onChange={alCambiar}
          required={requerido}
          {...otrasPropiedades}
        >
          <option value="">Seleccione...</option>
          {opciones.map((opcion) => (
            <option key={opcion.valor} value={opcion.valor}>
              {opcion.texto}
            </option>
          ))}
        </select>
      ) : tipo === "textarea" ? (
        <textarea
          id={nombre}
          name={nombre}
          className={claseConError}
          value={valor ?? ""}
          onChange={alCambiar}
          required={requerido}
          rows={3}
          {...otrasPropiedades}
        />
      ) : (
        <input
          id={nombre}
          name={nombre}
          type={tipo}
          className={claseConError}
          value={valor ?? ""}
          onChange={alCambiar}
          required={requerido}
          {...otrasPropiedades}
        />
      )}

      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
}