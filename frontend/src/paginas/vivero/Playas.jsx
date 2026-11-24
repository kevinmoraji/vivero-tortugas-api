import { useState } from "react";

import { playasApi } from "../../api/servicios";
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

const PLAYA_VACIA = { nombre: "", provincia: "", canton: "", descripcion: "", activa: true };

const PROVINCIAS = ["Guanacaste", "Puntarenas", "Limón", "San José", "Alajuela", "Cartago", "Heredia"].map(
  (provincia) => ({ valor: provincia, texto: provincia }),
);

export default function Playas() {
  const { roles } = useSesion();
  const { mostrarExito, mostrarError } = useAvisos();
  const listado = useListadoPaginado(playasApi, { search: "", activa: "", ordering: "nombre" });

  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [ventanaVisible, setVentanaVisible] = useState(false);
  const [playaEnEdicion, setPlayaEnEdicion] = useState(null);
  const [datosDeLaPlaya, setDatosDeLaPlaya] = useState(PLAYA_VACIA);
  const [erroresPorCampo, setErroresPorCampo] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [playaPorEliminar, setPlayaPorEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const abrirParaCrear = () => {
    setPlayaEnEdicion(null);
    setDatosDeLaPlaya(PLAYA_VACIA);
    setErroresPorCampo({});
    setVentanaVisible(true);
  };

  const abrirParaEditar = (playa) => {
    setPlayaEnEdicion(playa);
    setDatosDeLaPlaya({
      nombre: playa.nombre,
      provincia: playa.provincia,
      canton: playa.canton,
      descripcion: playa.descripcion,
      activa: playa.activa,
    });
    setErroresPorCampo({});
    setVentanaVisible(true);
  };

  const manejarCambio = (evento) => {
    const { name: nombreDelCampo, value, type, checked } = evento.target;
    setDatosDeLaPlaya((datosAnteriores) => ({
      ...datosAnteriores,
      [nombreDelCampo]: type === "checkbox" ? checked : value,
    }));
  };

  const guardarPlaya = async () => {
    setGuardando(true);
    setErroresPorCampo({});
    try {
      if (playaEnEdicion) {
        await playasApi.actualizar(playaEnEdicion.id, datosDeLaPlaya);
        mostrarExito("Playa actualizada.");
      } else {
        await playasApi.crear(datosDeLaPlaya);
        mostrarExito("Playa registrada.");
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
      await playasApi.eliminar(playaPorEliminar.id);
      mostrarExito(`Playa ${playaPorEliminar.nombre} eliminada.`);
      setPlayaPorEliminar(null);
      listado.recargar();
    } catch (errorAlEliminar) {
      mostrarError(textoDelError(errorAlEliminar));
      setPlayaPorEliminar(null);
    } finally {
      setEliminando(false);
    }
  };

  const columnas = [
    { titulo: "Nombre", mostrar: (playa) => playa.nombre },
    { titulo: "Provincia", mostrar: (playa) => playa.provincia },
    { titulo: "Cantón", mostrar: (playa) => playa.canton || "—" },
    { titulo: "Sectores", mostrar: (playa) => playa.total_sectores },
    {
      titulo: "Estado",
      mostrar: (playa) =>
        playa.activa ? (
          <span className="badge text-bg-success">Activa</span>
        ) : (
          <span className="badge text-bg-secondary">Inactiva</span>
        ),
    },
  ];

  const usuarioPuedeEditar = puedeEditar(roles, "playas");
  const usuarioPuedeEliminar = puedeEliminar(roles, "playas");

  const accionesDeLaFila =
    usuarioPuedeEditar || usuarioPuedeEliminar
      ? (playa) => (
          <>
            {usuarioPuedeEditar && (
              <button
                type="button"
                className="btn btn-outline-primary btn-sm me-1"
                title="Editar"
                onClick={() => abrirParaEditar(playa)}
              >
                <i className="bi bi-pencil" />
              </button>
            )}
            {usuarioPuedeEliminar && (
              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                title="Eliminar"
                onClick={() => setPlayaPorEliminar(playa)}
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
          <i className="bi bi-geo-alt me-2" />
          Playas
        </h1>
        {puedeCrear(roles, "playas") && (
          <button type="button" className="btn btn-success" onClick={abrirParaCrear}>
            <i className="bi bi-plus-lg me-1" />
            Nueva playa
          </button>
        )}
      </div>

      <form
        className="row g-2 mb-3"
        onSubmit={(evento) => {
          evento.preventDefault();
          listado.cambiarFiltro("search", textoBusqueda.trim());
        }}
      >
        <div className="col-md-8">
          <div className="input-group">
            <input
              className="form-control"
              placeholder="Buscar por nombre o cantón"
              value={textoBusqueda}
              onChange={(evento) => setTextoBusqueda(evento.target.value)}
            />
            <button className="btn btn-outline-success" type="submit">
              <i className="bi bi-search" />
            </button>
          </div>
        </div>
        <div className="col-md-4">
          <select
            className="form-select"
            value={listado.filtros.activa}
            onChange={(evento) => listado.cambiarFiltro("activa", evento.target.value)}
          >
            <option value="">Activas e inactivas</option>
            <option value="true">Solo activas</option>
            <option value="false">Solo inactivas</option>
          </select>
        </div>
      </form>

      <EstadoCarga cargando={listado.cargando} error={listado.error} alReintentar={listado.recargar}>
        <Tabla
          columnas={columnas}
          filas={listado.registros}
          acciones={accionesDeLaFila}
          textoVacio="No hay playas que coincidan con la búsqueda."
        />
        <Paginacion
          paginaActual={listado.pagina}
          totalRegistros={listado.totalRegistros}
          alCambiarPagina={listado.setPagina}
        />
      </EstadoCarga>

      <VentanaFormulario
        visible={ventanaVisible}
        titulo={playaEnEdicion ? `Editar ${playaEnEdicion.nombre}` : "Nueva playa"}
        guardando={guardando}
        alGuardar={guardarPlaya}
        alCerrar={() => setVentanaVisible(false)}
      >
        <CampoFormulario
          etiqueta="Nombre"
          nombre="nombre"
          valor={datosDeLaPlaya.nombre}
          alCambiar={manejarCambio}
          error={erroresPorCampo.nombre}
          requerido
        />
        <CampoFormulario
          etiqueta="Provincia"
          nombre="provincia"
          valor={datosDeLaPlaya.provincia}
          alCambiar={manejarCambio}
          error={erroresPorCampo.provincia}
          opciones={PROVINCIAS}
          requerido
        />
        <CampoFormulario
          etiqueta="Cantón"
          nombre="canton"
          valor={datosDeLaPlaya.canton}
          alCambiar={manejarCambio}
          error={erroresPorCampo.canton}
        />
        <CampoFormulario
          etiqueta="Descripción"
          nombre="descripcion"
          tipo="textarea"
          valor={datosDeLaPlaya.descripcion}
          alCambiar={manejarCambio}
          error={erroresPorCampo.descripcion}
        />
        <div className="form-check">
          <input
            id="activa"
            name="activa"
            type="checkbox"
            className="form-check-input"
            checked={datosDeLaPlaya.activa}
            onChange={manejarCambio}
          />
          <label htmlFor="activa" className="form-check-label">
            Playa activa (se pueden programar turnos)
          </label>
        </div>
      </VentanaFormulario>

      <ModalConfirmacion
        visible={Boolean(playaPorEliminar)}
        titulo="Eliminar playa"
        mensaje={`¿Seguro que desea eliminar ${playaPorEliminar?.nombre}? También se borrarán sus sectores.`}
        procesando={eliminando}
        alConfirmar={confirmarEliminacion}
        alCancelar={() => setPlayaPorEliminar(null)}
      />
    </>
  );
}