import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { listarParaSelector, playasApi, turnosApi } from "../../api/servicios";
import { interpretarError, textoDelError } from "../../api/errores";
import { useSesion } from "../../contextos/ContextoSesion";
import { useAvisos } from "../../contextos/ContextoAvisos";
import { useListadoPaginado } from "../../ganchos/useListadoPaginado";
import { puedeCrear, puedeEditar, puedeEliminar } from "../../utilidades/permisos";
import { aValorFechaHoraLocal, formatearFechaHora } from "../../utilidades/formatos";
import Tabla from "../../componentes/Tabla";
import Paginacion from "../../componentes/Paginacion";
import EstadoCarga from "../../componentes/EstadoCarga";
import ModalConfirmacion from "../../componentes/ModalConfirmacion";
import VentanaFormulario from "../../componentes/VentanaFormulario";
import CampoFormulario from "../../componentes/CampoFormulario";
import EtiquetaCupo from "./EtiquetaCupo";

const TURNO_VACIO = { playa: "", inicio: "", fin: "", cupo_maximo: "4", observaciones: "" };

const FILTROS_INICIALES = { playa: "", desde: "", hasta: "", con_cupo: "", ordering: "-inicio" };

export default function Turnos() {
  const { roles } = useSesion();
  const { mostrarExito, mostrarError } = useAvisos();
  const listado = useListadoPaginado(turnosApi, FILTROS_INICIALES);

  const [playas, setPlayas] = useState([]);
  const [ventanaVisible, setVentanaVisible] = useState(false);
  const [turnoEnEdicion, setTurnoEnEdicion] = useState(null);
  const [datosDelTurno, setDatosDelTurno] = useState(TURNO_VACIO);
  const [erroresPorCampo, setErroresPorCampo] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [turnoPorEliminar, setTurnoPorEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    listarParaSelector(playasApi)
      .then(setPlayas)
      .catch(() => setPlayas([]));
  }, []);

  const opcionesDePlaya = playas
    .filter((playa) => playa.activa || String(playa.id) === datosDelTurno.playa)
    .map((playa) => ({ valor: String(playa.id), texto: playa.nombre }));

  const abrirParaCrear = () => {
    setTurnoEnEdicion(null);
    setDatosDelTurno({ ...TURNO_VACIO, playa: listado.filtros.playa });
    setErroresPorCampo({});
    setVentanaVisible(true);
  };

  const abrirParaEditar = (turno) => {
    setTurnoEnEdicion(turno);
    setDatosDelTurno({
      playa: String(turno.playa),
      inicio: aValorFechaHoraLocal(turno.inicio),
      fin: aValorFechaHoraLocal(turno.fin),
      cupo_maximo: String(turno.cupo_maximo),
      observaciones: turno.observaciones,
    });
    setErroresPorCampo({});
    setVentanaVisible(true);
  };

  const manejarCambio = (evento) => {
    const { name: nombreDelCampo, value: valor } = evento.target;
    setDatosDelTurno((datosAnteriores) => ({ ...datosAnteriores, [nombreDelCampo]: valor }));
  };

  const guardarTurno = async () => {
    setGuardando(true);
    setErroresPorCampo({});
    const datosParaEnviar = {
      ...datosDelTurno,
      playa: Number(datosDelTurno.playa) || null,
      inicio: datosDelTurno.inicio || null,
      fin: datosDelTurno.fin || null,
      cupo_maximo: Number(datosDelTurno.cupo_maximo) || null,
    };
    try {
      if (turnoEnEdicion) {
        await turnosApi.actualizar(turnoEnEdicion.id, datosParaEnviar);
        mostrarExito("Turno actualizado.");
      } else {
        await turnosApi.crear(datosParaEnviar);
        mostrarExito("Turno programado.");
      }
      setVentanaVisible(false);
      listado.recargar();
    } catch (errorAlGuardar) {
      const { mensaje, erroresPorCampo: erroresDeDjango } = interpretarError(errorAlGuardar);
      setErroresPorCampo(erroresDeDjango);
      mostrarError(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminacion = async () => {
    setEliminando(true);
    try {
      await turnosApi.eliminar(turnoPorEliminar.id);
      mostrarExito("Turno eliminado.");
      setTurnoPorEliminar(null);
      listado.recargar();
    } catch (errorAlEliminar) {
      mostrarError(textoDelError(errorAlEliminar));
      setTurnoPorEliminar(null);
    } finally {
      setEliminando(false);
    }
  };

  const limpiarFiltros = () => {
    Object.entries(FILTROS_INICIALES).forEach(([nombreDelFiltro, valor]) => listado.cambiarFiltro(nombreDelFiltro, valor));
  };

  const columnas = [
    {
      titulo: "Inicio",
      mostrar: (turno) => <Link to={`/turnos/${turno.id}`}>{formatearFechaHora(turno.inicio)}</Link>,
    },
    { titulo: "Fin", mostrar: (turno) => formatearFechaHora(turno.fin) },
    { titulo: "Playa", mostrar: (turno) => turno.playa_nombre },
    { titulo: "Voluntarios", mostrar: (turno) => <EtiquetaCupo turno={turno} /> },
  ];

  const accionesDeLaFila = (turno) => (
    <>
      <Link to={`/turnos/${turno.id}`} className="btn btn-outline-secondary btn-sm me-1" title="Ver y asignar voluntarios">
        <i className="bi bi-eye" />
      </Link>
      {puedeEditar(roles, "turnos") && (
        <button
          type="button"
          className="btn btn-outline-primary btn-sm me-1"
          title="Editar"
          onClick={() => abrirParaEditar(turno)}
        >
          <i className="bi bi-pencil" />
        </button>
      )}
      {puedeEliminar(roles, "turnos") && (
        <button
          type="button"
          className="btn btn-outline-danger btn-sm"
          title="Eliminar"
          onClick={() => setTurnoPorEliminar(turno)}
        >
          <i className="bi bi-trash" />
        </button>
      )}
    </>
  );

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">
          <i className="bi bi-calendar-week me-2" />
          Turnos de patrullaje
        </h1>
        {puedeCrear(roles, "turnos") && (
          <button type="button" className="btn btn-success" onClick={abrirParaCrear}>
            <i className="bi bi-plus-lg me-1" />
            Nuevo turno
          </button>
        )}
      </div>

      <div className="card mb-3">
        <div className="card-body row g-2">
          <div className="col-md-3">
            <select
              className="form-select"
              value={listado.filtros.playa}
              onChange={(evento) => listado.cambiarFiltro("playa", evento.target.value)}
            >
              <option value="">Todas las playas</option>
              {playas.map((playa) => (
                <option key={playa.id} value={playa.id}>
                  {playa.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <input
              type="date"
              className="form-control"
              title="Desde"
              value={listado.filtros.desde}
              onChange={(evento) => listado.cambiarFiltro("desde", evento.target.value)}
            />
          </div>
          <div className="col-md-2">
            <input
              type="date"
              className="form-control"
              title="Hasta"
              value={listado.filtros.hasta}
              onChange={(evento) => listado.cambiarFiltro("hasta", evento.target.value)}
            />
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={listado.filtros.con_cupo}
              onChange={(evento) => listado.cambiarFiltro("con_cupo", evento.target.value)}
            >
              <option value="">Con y sin cupo</option>
              <option value="true">Con cupo disponible</option>
              <option value="false">Llenos</option>
            </select>
          </div>
          <div className="col-md-2 d-grid">
            <button type="button" className="btn btn-outline-secondary" onClick={limpiarFiltros}>
              Limpiar
            </button>
          </div>
        </div>
      </div>

      <EstadoCarga cargando={listado.cargando} error={listado.error} alReintentar={listado.recargar}>
        <Tabla
          columnas={columnas}
          filas={listado.registros}
          acciones={accionesDeLaFila}
          textoVacio="No hay turnos con esos filtros."
        />
        <Paginacion
          paginaActual={listado.pagina}
          totalRegistros={listado.totalRegistros}
          alCambiarPagina={listado.setPagina}
        />
      </EstadoCarga>

      <VentanaFormulario
        visible={ventanaVisible}
        titulo={turnoEnEdicion ? "Editar turno" : "Nuevo turno"}
        guardando={guardando}
        alGuardar={guardarTurno}
        alCerrar={() => setVentanaVisible(false)}
      >
        <CampoFormulario
          etiqueta="Playa"
          nombre="playa"
          valor={datosDelTurno.playa}
          alCambiar={manejarCambio}
          error={erroresPorCampo.playa}
          opciones={opcionesDePlaya}
          requerido
        />
        <div className="row">
          <div className="col-sm-6">
            <CampoFormulario
              etiqueta="Inicio"
              nombre="inicio"
              tipo="datetime-local"
              valor={datosDelTurno.inicio}
              alCambiar={manejarCambio}
              error={erroresPorCampo.inicio}
              requerido
            />
          </div>
          <div className="col-sm-6">
            <CampoFormulario
              etiqueta="Fin"
              nombre="fin"
              tipo="datetime-local"
              valor={datosDelTurno.fin}
              alCambiar={manejarCambio}
              error={erroresPorCampo.fin}
              requerido
            />
          </div>
        </div>
        <CampoFormulario
          etiqueta="Cupo máximo de voluntarios"
          nombre="cupo_maximo"
          tipo="number"
          min={1}
          max={10}
          valor={datosDelTurno.cupo_maximo}
          alCambiar={manejarCambio}
          error={erroresPorCampo.cupo_maximo}
          requerido
        />
        <CampoFormulario
          etiqueta="Observaciones"
          nombre="observaciones"
          tipo="textarea"
          valor={datosDelTurno.observaciones}
          alCambiar={manejarCambio}
          error={erroresPorCampo.observaciones}
        />
      </VentanaFormulario>

      <ModalConfirmacion
        visible={Boolean(turnoPorEliminar)}
        titulo="Eliminar turno"
        mensaje={`¿Seguro que desea eliminar el turno del ${formatearFechaHora(turnoPorEliminar?.inicio)} en ${turnoPorEliminar?.playa_nombre}?`}
        procesando={eliminando}
        alConfirmar={confirmarEliminacion}
        alCancelar={() => setTurnoPorEliminar(null)}
      />
    </>
  );
}