import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { listarParaSelector, turnosApi, voluntariosApi } from "../../api/servicios";
import { interpretarError, textoDelError } from "../../api/errores";
import { useSesion } from "../../contextos/ContextoSesion";
import { useAvisos } from "../../contextos/ContextoAvisos";
import { puedeEditar } from "../../utilidades/permisos";
import { ROLES_EN_TURNO, formatearFechaHora, textoDeOpcion } from "../../utilidades/formatos";
import EstadoCarga from "../../componentes/EstadoCarga";
import ModalConfirmacion from "../../componentes/ModalConfirmacion";
import CampoFormulario from "../../componentes/CampoFormulario";
import EtiquetaCupo from "./EtiquetaCupo";

export default function DetalleTurno() {
  const { id: idDelTurno } = useParams();
  const { roles } = useSesion();
  const { mostrarExito, mostrarError } = useAvisos();

  const [turno, setTurno] = useState(null);
  const [voluntariosActivos, setVoluntariosActivos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorDeCarga, setErrorDeCarga] = useState("");

  const [voluntarioElegido, setVoluntarioElegido] = useState("");
  const [rolElegido, setRolElegido] = useState("PATRULLERO");
  const [erroresDeAsignacion, setErroresDeAsignacion] = useState({});
  const [asignando, setAsignando] = useState(false);

  const [asignacionPorRetirar, setAsignacionPorRetirar] = useState(null);
  const [retirando, setRetirando] = useState(false);

  const cargarTurno = useCallback(async () => {
    setErrorDeCarga("");
    try {
      setTurno(await turnosApi.obtener(idDelTurno));
    } catch (error) {
      setErrorDeCarga(textoDelError(error));
    } finally {
      setCargando(false);
    }
  }, [idDelTurno]);

  useEffect(() => {
    cargarTurno();
    listarParaSelector(voluntariosApi, { activo: true, ordering: "apellidos" })
      .then(setVoluntariosActivos)
      .catch(() => setVoluntariosActivos([]));
  }, [cargarTurno]);

  const asignarVoluntario = async (evento) => {
    evento.preventDefault();
    setAsignando(true);
    setErroresDeAsignacion({});
    try {
      await turnosApi.asignarVoluntario(idDelTurno, Number(voluntarioElegido) || null, rolElegido);
      mostrarExito("Voluntario asignado al turno.");
      setVoluntarioElegido("");
      setRolElegido("PATRULLERO");
      cargarTurno();
    } catch (errorAlAsignar) {
      const { mensaje, erroresPorCampo } = interpretarError(errorAlAsignar);
      setErroresDeAsignacion(erroresPorCampo);
      mostrarError(erroresPorCampo.turno || mensaje);
    } finally {
      setAsignando(false);
    }
  };

  const confirmarRetiro = async () => {
    setRetirando(true);
    try {
      await turnosApi.retirarVoluntario(idDelTurno, asignacionPorRetirar.voluntario);
      mostrarExito(`${asignacionPorRetirar.voluntario_nombre} fue retirado del turno.`);
      setAsignacionPorRetirar(null);
      cargarTurno();
    } catch (errorAlRetirar) {
      mostrarError(textoDelError(errorAlRetirar));
    } finally {
      setRetirando(false);
    }
  };

  const usuarioPuedeEditar = puedeEditar(roles, "turnos");

  const idsYaAsignados = turno ? turno.asignaciones.map((asignacion) => asignacion.voluntario) : [];
  const opcionesDeVoluntario = voluntariosActivos
    .filter((voluntario) => !idsYaAsignados.includes(voluntario.id))
    .map((voluntario) => ({
      valor: String(voluntario.id),
      texto: `${voluntario.apellidos}, ${voluntario.nombre}`,
    }));

  return (
    <EstadoCarga cargando={cargando} error={errorDeCarga} alReintentar={cargarTurno}>
      {turno && (
        <>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <h1 className="h3 mb-0">
              <i className="bi bi-calendar-week me-2" />
              Turno en {turno.playa_nombre}
            </h1>
            <Link to="/turnos" className="btn btn-outline-secondary">
              <i className="bi bi-arrow-left me-1" />
              Volver a turnos
            </Link>
          </div>

          <div className="row g-3">
            <div className="col-lg-4">
              <div className="card h-100">
                <div className="card-header">Datos del turno</div>
                <div className="card-body">
                  <dl className="mb-0">
                    <dt>Inicio</dt>
                    <dd>{formatearFechaHora(turno.inicio)}</dd>
                    <dt>Fin</dt>
                    <dd>{formatearFechaHora(turno.fin)}</dd>
                    <dt>Voluntarios</dt>
                    <dd>
                      <EtiquetaCupo turno={turno} />
                    </dd>
                    <dt>Observaciones</dt>
                    <dd className="mb-0">{turno.observaciones || "—"}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="col-lg-8">
              <div className="card">
                <div className="card-header">Voluntarios asignados</div>
                <ul className="list-group list-group-flush">
                  {turno.asignaciones.length === 0 && (
                    <li className="list-group-item text-muted">Todavía no hay voluntarios en este turno.</li>
                  )}
                  {turno.asignaciones.map((asignacion) => (
                    <li key={asignacion.id} className="list-group-item d-flex justify-content-between align-items-center">
                      <span>
                        <i className="bi bi-person me-2" />
                        {asignacion.voluntario_nombre}
                        <span className={`badge ms-2 ${asignacion.rol === "LIDER" ? "text-bg-primary" : "text-bg-light border"}`}>
                          {textoDeOpcion(ROLES_EN_TURNO, asignacion.rol)}
                        </span>
                      </span>
                      {usuarioPuedeEditar && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          title="Retirar del turno"
                          onClick={() => setAsignacionPorRetirar(asignacion)}
                        >
                          <i className="bi bi-person-dash" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>

                {usuarioPuedeEditar && (
                  <form className="card-body border-top" onSubmit={asignarVoluntario} noValidate>
                    <h2 className="h6">Asignar voluntario</h2>
                    <div className="row g-2 align-items-start">
                      <div className="col-md-6">
                        <CampoFormulario
                          etiqueta="Voluntario"
                          nombre="voluntario"
                          valor={voluntarioElegido}
                          alCambiar={(evento) => setVoluntarioElegido(evento.target.value)}
                          error={erroresDeAsignacion.voluntario}
                          opciones={opcionesDeVoluntario}
                        />
                      </div>
                      <div className="col-md-4">
                        <CampoFormulario
                          etiqueta="Rol en el turno"
                          nombre="rol"
                          valor={rolElegido}
                          alCambiar={(evento) => setRolElegido(evento.target.value)}
                          error={erroresDeAsignacion.rol}
                          opciones={ROLES_EN_TURNO}
                        />
                      </div>
                      <div className="col-md-2 d-grid" style={{ paddingTop: "2rem" }}>
                        <button type="submit" className="btn btn-success" disabled={asignando || !voluntarioElegido}>
                          {asignando ? <span className="spinner-border spinner-border-sm" /> : "Asignar"}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>

          <ModalConfirmacion
            visible={Boolean(asignacionPorRetirar)}
            titulo="Retirar voluntario"
            mensaje={`¿Retirar a ${asignacionPorRetirar?.voluntario_nombre} de este turno?`}
            textoConfirmar="Retirar"
            procesando={retirando}
            alConfirmar={confirmarRetiro}
            alCancelar={() => setAsignacionPorRetirar(null)}
          />
        </>
      )}
    </EstadoCarga>
  );
}