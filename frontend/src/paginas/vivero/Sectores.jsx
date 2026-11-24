import { useEffect, useState } from "react";

import { listarParaSelector, playasApi, sectoresApi } from "../../api/servicios";
import { interpretarError, textoDelError } from "../../api/errores";
import { useSesion } from "../../contextos/ContextoSesion";
import { useAvisos } from "../../contextos/ContextoAvisos";
import { useListadoPaginado } from "../../ganchos/useListadoPaginado";
import { puedeCrear, puedeEditar, puedeEliminar } from "../../utilidades/permisos";
import Tabla from "../../componentes/Tabla";
import Paginacion from "../../componentes/Paginacion";
import EstadoCarga from "../../componentes/EstadoCarga";
import ModalConfirmacion from "../../componentes/ModalConfirmacion";
import VentanaFormulario from "../../componentes/VentanaFormulario";
import CampoFormulario from "../../componentes/CampoFormulario";

const SECTOR_VACIO = { playa: "", codigo: "", activo: true };

export default function Sectores() {
  const { roles } = useSesion();
  const { mostrarExito, mostrarError } = useAvisos();
  const listado = useListadoPaginado(sectoresApi, { playa: "", activo: "" });

  const [playas, setPlayas] = useState([]);
  const [ventanaVisible, setVentanaVisible] = useState(false);
  const [sectorEnEdicion, setSectorEnEdicion] = useState(null);
  const [datosDelSector, setDatosDelSector] = useState(SECTOR_VACIO);
  const [erroresPorCampo, setErroresPorCampo] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [sectorPorEliminar, setSectorPorEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    listarParaSelector(playasApi)
      .then(setPlayas)
      .catch(() => setPlayas([]));
  }, []);

  const opcionesDePlaya = playas.map((playa) => ({ valor: String(playa.id), texto: playa.nombre }));

  const abrirParaCrear = () => {
    setSectorEnEdicion(null);
    setDatosDelSector({ ...SECTOR_VACIO, playa: listado.filtros.playa });
    setErroresPorCampo({});
    setVentanaVisible(true);
  };

  const abrirParaEditar = (sector) => {
    setSectorEnEdicion(sector);
    setDatosDelSector({ playa: String(sector.playa), codigo: sector.codigo, activo: sector.activo });
    setErroresPorCampo({});
    setVentanaVisible(true);
  };

  const manejarCambio = (evento) => {
    const { name: nombreDelCampo, value, type, checked } = evento.target;
    setDatosDelSector((datosAnteriores) => ({
      ...datosAnteriores,
      [nombreDelCampo]: type === "checkbox" ? checked : value,
    }));
  };

  const guardarSector = async () => {
    setGuardando(true);
    setErroresPorCampo({});
    const datosParaEnviar = { ...datosDelSector, playa: Number(datosDelSector.playa) || null };
    try {
      if (sectorEnEdicion) {
        await sectoresApi.actualizar(sectorEnEdicion.id, datosParaEnviar);
        mostrarExito("Sector actualizado.");
      } else {
        await sectoresApi.crear(datosParaEnviar);
        mostrarExito("Sector registrado.");
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
      await sectoresApi.eliminar(sectorPorEliminar.id);
      mostrarExito(`Sector ${sectorPorEliminar.codigo} eliminado.`);
      setSectorPorEliminar(null);
      listado.recargar();
    } catch (errorAlEliminar) {
      mostrarError(textoDelError(errorAlEliminar));
      setSectorPorEliminar(null);
    } finally {
      setEliminando(false);
    }
  };

  const columnas = [
    { titulo: "Código", mostrar: (sector) => sector.codigo },
    { titulo: "Playa", mostrar: (sector) => sector.playa_nombre },
    {
      titulo: "Ocupación",
      mostrar: (sector) =>
        sector.ocupado ? (
          <span className="badge text-bg-warning">Con nido incubando</span>
        ) : (
          <span className="badge text-bg-light border">Libre</span>
        ),
    },
    {
      titulo: "Estado",
      mostrar: (sector) =>
        sector.activo ? (
          <span className="badge text-bg-success">Activo</span>
        ) : (
          <span className="badge text-bg-secondary">Inactivo</span>
        ),
    },
  ];

  const usuarioPuedeEditar = puedeEditar(roles, "sectores");
  const usuarioPuedeEliminar = puedeEliminar(roles, "sectores");

  const accionesDeLaFila =
    usuarioPuedeEditar || usuarioPuedeEliminar
      ? (sector) => (
          <>
            {usuarioPuedeEditar && (
              <button
                type="button"
                className="btn btn-outline-primary btn-sm me-1"
                title="Editar"
                onClick={() => abrirParaEditar(sector)}
              >
                <i className="bi bi-pencil" />
              </button>
            )}
            {usuarioPuedeEliminar && (
              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                title="Eliminar"
                onClick={() => setSectorPorEliminar(sector)}
              >
                <i className="bi bi-trash" />
              </button>
            )}
          </>
        )
      : undefined;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">
          <i className="bi bi-grid-3x3 me-2" />
          Sectores del vivero
        </h1>
        {puedeCrear(roles, "sectores") && (
          <button type="button" className="btn btn-success" onClick={abrirParaCrear}>
            <i className="bi bi-plus-lg me-1" />
            Nuevo sector
          </button>
        )}
      </div>

      <div className="row g-2 mb-3">
        <div className="col-md-6">
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
        <div className="col-md-6">
          <select
            className="form-select"
            value={listado.filtros.activo}
            onChange={(evento) => listado.cambiarFiltro("activo", evento.target.value)}
          >
            <option value="">Activos e inactivos</option>
            <option value="true">Solo activos</option>
            <option value="false">Solo inactivos</option>
          </select>
        </div>
      </div>

      <EstadoCarga cargando={listado.cargando} error={listado.error} alReintentar={listado.recargar}>
        <Tabla
          columnas={columnas}
          filas={listado.registros}
          acciones={accionesDeLaFila}
          textoVacio="No hay sectores con esos filtros."
        />
        <Paginacion
          paginaActual={listado.pagina}
          totalRegistros={listado.totalRegistros}
          alCambiarPagina={listado.setPagina}
        />
      </EstadoCarga>

      <VentanaFormulario
        visible={ventanaVisible}
        titulo={sectorEnEdicion ? `Editar sector ${sectorEnEdicion.codigo}` : "Nuevo sector"}
        guardando={guardando}
        alGuardar={guardarSector}
        alCerrar={() => setVentanaVisible(false)}
      >
        <CampoFormulario
          etiqueta="Playa"
          nombre="playa"
          valor={datosDelSector.playa}
          alCambiar={manejarCambio}
          error={erroresPorCampo.playa}
          opciones={opcionesDePlaya}
          requerido
        />
        <CampoFormulario
          etiqueta="Código"
          nombre="codigo"
          valor={datosDelSector.codigo}
          alCambiar={manejarCambio}
          error={erroresPorCampo.codigo}
          placeholder="Ej.: A-01"
          requerido
        />
        <div className="form-check">
          <input
            id="activo"
            name="activo"
            type="checkbox"
            className={`form-check-input ${erroresPorCampo.activo ? "is-invalid" : ""}`}
            checked={datosDelSector.activo}
            onChange={manejarCambio}
          />
          <label htmlFor="activo" className="form-check-label">
            Sector activo (se pueden sembrar nidos)
          </label>
          {erroresPorCampo.activo && <div className="invalid-feedback">{erroresPorCampo.activo}</div>}
        </div>
      </VentanaFormulario>

      <ModalConfirmacion
        visible={Boolean(sectorPorEliminar)}
        titulo="Eliminar sector"
        mensaje={`¿Seguro que desea eliminar el sector ${sectorPorEliminar?.codigo} de ${sectorPorEliminar?.playa_nombre}?`}
        procesando={eliminando}
        alConfirmar={confirmarEliminacion}
        alCancelar={() => setSectorPorEliminar(null)}
      />
    </>
  );
}