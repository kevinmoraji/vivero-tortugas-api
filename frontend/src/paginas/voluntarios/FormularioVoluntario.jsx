import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { voluntariosApi } from "../../api/servicios";
import { interpretarError, textoDelError } from "../../api/errores";
import { useAvisos } from "../../contextos/ContextoAvisos";
import { fechaDeHoy } from "../../utilidades/formatos";
import CampoFormulario from "../../componentes/CampoFormulario";
import EstadoCarga from "../../componentes/EstadoCarga";

const VOLUNTARIO_VACIO = {
  cedula: "",
  nombre: "",
  apellidos: "",
  email: "",
  telefono: "",
  fecha_ingreso: fechaDeHoy(),
  activo: true,
};

// Sirve para crear (/voluntarios/nuevo) y para editar (/voluntarios/:id/editar)
export default function FormularioVoluntario() {
  const { id: idDelVoluntario } = useParams();
  const esEdicion = Boolean(idDelVoluntario);
  const navegar = useNavigate();
  const { mostrarExito, mostrarError } = useAvisos();

  const [datosDelVoluntario, setDatosDelVoluntario] = useState(VOLUNTARIO_VACIO);
  const [erroresPorCampo, setErroresPorCampo] = useState({});
  const [cargando, setCargando] = useState(esEdicion);
  const [errorDeCarga, setErrorDeCarga] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!esEdicion) return;
    voluntariosApi
      .obtener(idDelVoluntario)
      .then((voluntario) =>
        setDatosDelVoluntario({
          cedula: voluntario.cedula,
          nombre: voluntario.nombre,
          apellidos: voluntario.apellidos,
          email: voluntario.email,
          telefono: voluntario.telefono,
          fecha_ingreso: voluntario.fecha_ingreso,
          activo: voluntario.activo,
        }),
      )
      .catch((error) => setErrorDeCarga(textoDelError(error)))
      .finally(() => setCargando(false));
  }, [esEdicion, idDelVoluntario]);

  const manejarCambio = (evento) => {
    const { name: nombreDelCampo, value, type, checked } = evento.target;
    setDatosDelVoluntario((datosAnteriores) => ({
      ...datosAnteriores,
      [nombreDelCampo]: type === "checkbox" ? checked : value,
    }));
    setErroresPorCampo((erroresAnteriores) => ({ ...erroresAnteriores, [nombreDelCampo]: "" }));
  };

  const manejarEnvio = async (evento) => {
    evento.preventDefault();
    setGuardando(true);
    setErroresPorCampo({});
    try {
      if (esEdicion) {
        await voluntariosApi.actualizar(idDelVoluntario, datosDelVoluntario);
        mostrarExito("Voluntario actualizado.");
      } else {
        await voluntariosApi.crear(datosDelVoluntario);
        mostrarExito("Voluntario registrado.");
      }
      navegar("/voluntarios");
    } catch (errorAlGuardar) {
      const { mensaje, erroresPorCampo: erroresDeDjango } = interpretarError(errorAlGuardar);
      setErroresPorCampo(erroresDeDjango);
      mostrarError(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <h1 className="h3 mb-3">
        <i className="bi bi-person-vcard me-2" />
        {esEdicion ? "Editar voluntario" : "Registrar voluntario"}
      </h1>

      <EstadoCarga cargando={cargando} error={errorDeCarga}>
        <form className="card card-body" onSubmit={manejarEnvio} noValidate>
          <div className="row">
            <div className="col-md-4">
              <CampoFormulario
                etiqueta="Cédula"
                nombre="cedula"
                valor={datosDelVoluntario.cedula}
                alCambiar={manejarCambio}
                error={erroresPorCampo.cedula}
                placeholder="9 dígitos, ej.: 601230456"
                requerido
              />
            </div>
            <div className="col-md-4">
              <CampoFormulario
                etiqueta="Nombre"
                nombre="nombre"
                valor={datosDelVoluntario.nombre}
                alCambiar={manejarCambio}
                error={erroresPorCampo.nombre}
                requerido
              />
            </div>
            <div className="col-md-4">
              <CampoFormulario
                etiqueta="Apellidos"
                nombre="apellidos"
                valor={datosDelVoluntario.apellidos}
                alCambiar={manejarCambio}
                error={erroresPorCampo.apellidos}
                requerido
              />
            </div>

            <div className="col-md-6">
              <CampoFormulario
                etiqueta="Correo electrónico"
                nombre="email"
                tipo="email"
                valor={datosDelVoluntario.email}
                alCambiar={manejarCambio}
                error={erroresPorCampo.email}
                requerido
              />
            </div>
            <div className="col-md-3">
              <CampoFormulario
                etiqueta="Teléfono"
                nombre="telefono"
                valor={datosDelVoluntario.telefono}
                alCambiar={manejarCambio}
                error={erroresPorCampo.telefono}
                placeholder="8 dígitos"
              />
            </div>
            <div className="col-md-3">
              <CampoFormulario
                etiqueta="Fecha de ingreso"
                nombre="fecha_ingreso"
                tipo="date"
                valor={datosDelVoluntario.fecha_ingreso}
                alCambiar={manejarCambio}
                error={erroresPorCampo.fecha_ingreso}
                max={fechaDeHoy()}
                requerido
              />
            </div>
          </div>

          <div className="form-check mb-3">
            <input
              id="activo"
              name="activo"
              type="checkbox"
              className="form-check-input"
              checked={datosDelVoluntario.activo}
              onChange={manejarCambio}
            />
            <label htmlFor="activo" className="form-check-label">
              Voluntario activo (se puede asignar a turnos)
            </label>
          </div>

          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-success" disabled={guardando}>
              {guardando && <span className="spinner-border spinner-border-sm me-2" />}
              Guardar
            </button>
            <Link to="/voluntarios" className="btn btn-outline-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </EstadoCarga>
    </>
  );
}