import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { nidosApi } from "../../api/servicios";
import { textoDelError } from "../../api/errores";
import { useSesion } from "../../contextos/ContextoSesion";
import { useAvisos } from "../../contextos/ContextoAvisos";
import { puedeEditar } from "../../utilidades/permisos";
import { ESPECIES, formatearFecha, textoDeOpcion } from "../../utilidades/formatos";
import EstadoCarga from "../../componentes/EstadoCarga";
import ModalConfirmacion from "../../componentes/ModalConfirmacion";
import EtiquetaEstadoNido from "./EtiquetaEstadoNido";

export default function DetalleNido() {
  const { id: idDelNido } = useParams();
  const { roles } = useSesion();
  const { mostrarExito, mostrarError } = useAvisos();

  const [nido, setNido] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorDeCarga, setErrorDeCarga] = useState("");
  const [modalPerdidoVisible, setModalPerdidoVisible] = useState(false);
  const [motivoDePerdida, setMotivoDePerdida] = useState("");
  const [marcandoPerdido, setMarcandoPerdido] = useState(false);

  const cargarNido = useCallback(async () => {
    setCargando(true);
    setErrorDeCarga("");
    try {
      setNido(await nidosApi.obtener(idDelNido));
    } catch (error) {
      setErrorDeCarga(textoDelError(error));
    } finally {
      setCargando(false);
    }
  }, [idDelNido]);

  useEffect(() => {
    cargarNido();
  }, [cargarNido]);

  const confirmarPerdida = async () => {
    setMarcandoPerdido(true);
    try {
      await nidosApi.marcarPerdido(idDelNido, motivoDePerdida.trim());
      mostrarExito(`El nido ${nido.codigo} quedó marcado como perdido.`);
      setModalPerdidoVisible(false);
      setMotivoDePerdida("");
      cargarNido();
    } catch (error) {
      mostrarError(textoDelError(error));
    } finally {
      setMarcandoPerdido(false);
    }
  };

  const usuarioPuedeEditar = puedeEditar(roles, "nidos");
  const estaIncubando = nido?.estado === "INCUBANDO";

  return (
    <EstadoCarga cargando={cargando} error={errorDeCarga} alReintentar={cargarNido}>
      {nido && (
        <>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <h1 className="h3 mb-0">
              <i className="bi bi-egg me-2" />
              Nido {nido.codigo} <EtiquetaEstadoNido estado={nido.estado} />
            </h1>
            <div className="d-flex gap-2">
              <Link to="/nidos" className="btn btn-outline-secondary">
                <i className="bi bi-arrow-left me-1" />
                Volver
              </Link>
              {usuarioPuedeEditar && (
                <Link to={`/nidos/${nido.id}/editar`} className="btn btn-outline-primary">
                  <i className="bi bi-pencil me-1" />
                  Editar
                </Link>
              )}
              {usuarioPuedeEditar && estaIncubando && (
                <button type="button" className="btn btn-outline-danger" onClick={() => setModalPerdidoVisible(true)}>
                  <i className="bi bi-x-octagon me-1" />
                  Marcar como perdido
                </button>
              )}
            </div>
          </div>

          <div className="row g-3">
            <div className="col-lg-7">
              <div className="card h-100">
                <div className="card-header">Datos del nido</div>
                <div className="card-body">
                  <dl className="row mb-0">
                    <dt className="col-sm-5">Especie</dt>
                    <dd className="col-sm-7">{textoDeOpcion(ESPECIES, nido.especie)}</dd>

                    <dt className="col-sm-5">Playa</dt>
                    <dd className="col-sm-7">{nido.playa_nombre}</dd>

                    <dt className="col-sm-5">Sector del vivero</dt>
                    <dd className="col-sm-7">{nido.sector_codigo}</dd>

                    <dt className="col-sm-5">Fecha de siembra</dt>
                    <dd className="col-sm-7">{formatearFecha(nido.fecha_siembra)}</dd>

                    <dt className="col-sm-5">Días de incubación</dt>
                    <dd className="col-sm-7">{estaIncubando ? nido.dias_incubacion : "—"}</dd>

                    <dt className="col-sm-5">Huevos</dt>
                    <dd className="col-sm-7">{nido.huevos}</dd>

                    <dt className="col-sm-5">Turno</dt>
                    <dd className="col-sm-7">
                      <Link to={`/turnos/${nido.turno}`}>Ver turno #{nido.turno}</Link>
                    </dd>

                    <dt className="col-sm-5">Observaciones</dt>
                    <dd className="col-sm-7" style={{ whiteSpace: "pre-line" }}>
                      {nido.observaciones || "—"}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="col-lg-5 d-flex flex-column gap-3">
              <div className="card">
                <div className="card-header">Voluntarios que lo encontraron</div>
                <ul className="list-group list-group-flush">
                  {nido.voluntarios_del_turno.length === 0 && (
                    <li className="list-group-item text-muted">El turno no tiene voluntarios asignados.</li>
                  )}
                  {nido.voluntarios_del_turno.map((nombreDelVoluntario) => (
                    <li key={nombreDelVoluntario} className="list-group-item">
                      <i className="bi bi-person me-2" />
                      {nombreDelVoluntario}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card">
                <div className="card-header">Eclosión</div>
                <div className="card-body">
                  {nido.eclosion ? (
                    <p className="mb-0">
                      Eclosionó el {formatearFecha(nido.eclosion.fecha)} con{" "}
                      <strong>{nido.eclosion.crias_vivas}</strong> crías vivas.
                    </p>
                  ) : (
                    <p className="text-muted mb-0">Todavía no tiene eclosión registrada.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <ModalConfirmacion
            visible={modalPerdidoVisible}
            titulo={`Marcar el nido ${nido.codigo} como perdido`}
            textoConfirmar="Marcar como perdido"
            procesando={marcandoPerdido}
            alConfirmar={confirmarPerdida}
            alCancelar={() => setModalPerdidoVisible(false)}
            mensaje={
              <>
                El nido dejará de incubar y su sector quedará libre. ¿Por qué se perdió? (opcional)
                <textarea
                  className="form-control mt-2"
                  rows={2}
                  placeholder="Ej.: inundación por marea alta"
                  value={motivoDePerdida}
                  onChange={(evento) => setMotivoDePerdida(evento.target.value)}
                />
              </>
            }
          />
        </>
      )}
    </EstadoCarga>
  );
}