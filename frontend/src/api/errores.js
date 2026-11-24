const MENSAJES_POR_ESTADO = {
  400: "Revise los datos del formulario.",
  401: "Su sesión no es válida o expiró. Inicie sesión de nuevo.",
  403: "Su rol no tiene permiso para realizar esta operación.",
  404: "El registro solicitado no existe.",
  409: "La operación entra en conflicto con los datos actuales.",
  500: "Ocurrió un error interno en el servidor.",
};

export function interpretarError(error) {
  if (!error?.response) {
    return {
      estado: 0,
      mensaje: "No se pudo conectar con la API. Verifique que el backend Django esté encendido y su conexión de red.",
      erroresPorCampo: {},
    };
  }

  const { status: estado, data: datosRespuesta } = error.response;
  const mensajeServidor = typeof datosRespuesta?.detail === "string" ? datosRespuesta.detail : null;
  const erroresPorCampo = {};
  const mensajesGenerales = [];

  if (estado === 400 && datosRespuesta && typeof datosRespuesta === "object") {
    for (const [campo, valor] of Object.entries(datosRespuesta)) {
      const texto = Array.isArray(valor) ? valor.join(" ") : String(valor);
      if (campo === "non_field_errors" || campo === "detail") {
        mensajesGenerales.push(texto);
      } else {
        erroresPorCampo[campo] = texto;
      }
    }
  }

  const mensaje =
    mensajesGenerales.join(" ") || mensajeServidor || MENSAJES_POR_ESTADO[estado] || `Error inesperado (${estado}).`;

  return { estado, mensaje, erroresPorCampo };
}

export function textoDelError(error) {
  const { mensaje, erroresPorCampo } = interpretarError(error);
  const mensajesDeCampos = Object.values(erroresPorCampo);
  return mensajesDeCampos.length ? mensajesDeCampos.join(" ") : mensaje;
}