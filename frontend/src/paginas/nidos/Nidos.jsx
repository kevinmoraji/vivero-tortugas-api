import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { listarParaSelector, nidosApi, playasApi } from "../../api/servicios";
import { textoDelError } from "../../api/errores";
import { useSesion } from "../../contextos/ContextoSesion";
import { useAvisos } from "../../contextos/ContextoAvisos";
import { useListadoPaginado } from "../../ganchos/useListadoPaginado";
import { puedeCrear, puedeEditar, puedeEliminar } from "../../utilidades/permisos";
import { ESPECIES, ESTADOS_NIDO, formatearFecha, textoDeOpcion } from "../../utilidades/formatos";
import EtiquetaEstadoNido from "./EtiquetaEstadoNido";
import Tabla from "../../componentes/Tabla";
import Paginacion from "../../componentes/Paginacion";
import EstadoCarga from "../../componentes/EstadoCarga";
import ModalConfirmacion from "../../componentes/ModalConfirmacion";

const FILTROS_INICIALES = {
  search: "",
  especie: "",
  estado: "",
  playa: "",
  desde: "",
  hasta: "",
  ordering: "-fecha_siembra",
};

const OPCIONES_DE_ORDEN = [
  { valor: "-fecha_siembra", texto: "Más recientes primero" },
  { valor: "fecha_siembra", texto: "Más antiguos primero" },
  { valor: "-huevos", texto: "Más huevos primero" },
  { valor: "huevos", texto: "Menos huevos primero" },
  { valor: "codigo", texto: "Código (A-Z)" },
];

export default function Nidos() {
  const { roles } = useSesion();
  const { mostrarExito, mostrarError } = useAvisos();
  const listado = useListadoPaginado(nidosApi, FILTROS_INICIALES);

  const [playas, setPlayas] = useState([]);
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [nidoPorEliminar, setNidoPorEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    listarParaSelector(playasApi)
      .then(setPlayas)
      .catch(() => setPlayas([]));
  }, []);

  const manejarBusqueda = (evento) => {
    evento.preventDefault();
    listado.cambiarFiltro("search", textoBusqueda.trim());
  };

  const limpiarFiltros = () => {
    setTextoBusqueda("");
    Object.entries(FILTROS_INICIALES).forEach(([nombreDelFiltro, valor]) => listado.cambiarFiltro(nombreDelFiltro, valor));
  };

  const confirmarEliminacion = async () => {
    setEliminando(true);
    try {
      await nidosApi.eliminar(nidoPorEliminar.id);
      mostrarExito(`Nido ${nidoPorEliminar.codigo} eliminado.`);
      setNidoPorEliminar(null);
      listado.recargar();
    } catch (errorAlEliminar) {
      mostrarError(textoDelError(errorAlEliminar));
    } finally {
      setEliminando(false);
    }
  };

  const columnas = [
    { titulo: "Código", mostrar: (nido) => <Link to={`/nidos/${nido.id}`}>{nido.codigo}</Link> },
    { titulo: "Especie", mostrar: (nido) => textoDeOpcion(ESPECIES, nido.especie) },
    { titulo: "Playa", mostrar: (nido) => nido.playa_nombre },
    { titulo: "Sector", mostrar: (nido) => nido.sector_codigo },
    { titulo: "Siembra", mostrar: (nido) => formatearFecha(nido.fecha_siembra) },
    { titulo: "Días", mostrar: (nido) => (nido.estado === "INCUBANDO" ? nido.dias_incubacion : "—") },
    { titulo: "Huevos", mostrar: (nido) => nido.huevos },
    { titulo: "Estado", mostrar: (nido) => <EtiquetaEstadoNido estado={nido.estado} /> },
  ];

  const accionesDeLaFila = (nido) => (
    <>
      <Link to={`/nidos/${nido.id}`} className="btn btn-outline-secondary btn-sm me-1" title="Ver detalle">
        <i className="bi bi-eye" />
      </Link>
      {puedeEditar(roles, "nidos") && (
        <Link to={`/nidos/${nido.id}/editar`} className="btn btn-outline-primary btn-sm me-1" title="Editar">
          <i className="bi bi-pencil" />
        </Link>
      )}
      {puedeEliminar(roles, "nidos") && (
        <button type="button" className="btn btn-outline-danger btn-sm" title="Eliminar" onClick={() => setNidoPorEliminar(nido)}>
          <i className="bi bi-trash" />
        </button>
      )}
    </>
  );

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">
          <i className="bi bi-egg me-2" />
          Nidos
        </h1>
        {puedeCrear(roles, "nidos") && (
          <Link to="/nidos/nuevo" className="btn btn-success">
            <i className="bi bi-plus-lg me-1" />
            Nuevo nido
          </Link>
        )}
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <form className="row g-2" onSubmit={manejarBusqueda}>
            <div className="col-md-6">
              <div className="input-group">
                <input
                  className="form-control"
                  placeholder="Buscar por código u observaciones"
                  value={textoBusqueda}
                  onChange={(evento) => setTextoBusqueda(evento.target.value)}
                />
                <button className="btn btn-outline-success" type="submit">
                  <i className="bi bi-search" />
                </button>
              </div>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={listado.filtros.ordering}
                onChange={(evento) => listado.cambiarFiltro("ordering", evento.target.value)}
              >
                {OPCIONES_DE_ORDEN.map((opcion) => (
                  <option key={opcion.valor} value={opcion.valor}>
                    {opcion.texto}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3 d-grid">
              <button type="button" className="btn btn-outline-secondary" onClick={limpiarFiltros}>
                Limpiar filtros
              </button>
            </div>

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
            <div className="col-md-3">
              <select
                className="form-select"
                value={listado.filtros.especie}
                onChange={(evento) => listado.cambiarFiltro("especie", evento.target.value)}
              >
                <option value="">Todas las especies</option>
                {ESPECIES.map((especie) => (
                  <option key={especie.valor} value={especie.valor}>
                    {especie.texto}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                value={listado.filtros.estado}
                onChange={(evento) => listado.cambiarFiltro("estado", evento.target.value)}
              >
                <option value="">Todos los estados</option>
                {ESTADOS_NIDO.map((estado) => (
                  <option key={estado.valor} value={estado.valor}>
                    {estado.texto}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <input
                type="date"
                className="form-control"
                title="Sembrados desde"
                value={listado.filtros.desde}
                onChange={(evento) => listado.cambiarFiltro("desde", evento.target.value)}
              />
            </div>
            <div className="col-md-2">
              <input
                type="date"
                className="form-control"
                title="Sembrados hasta"
                value={listado.filtros.hasta}
                onChange={(evento) => listado.cambiarFiltro("hasta", evento.target.value)}
              />
            </div>
          </form>
        </div>
      </div>

      <EstadoCarga cargando={listado.cargando} error={listado.error} alReintentar={listado.recargar}>
        <Tabla
          columnas={columnas}
          filas={listado.registros}
          acciones={accionesDeLaFila}
          textoVacio="No hay nidos que coincidan con los filtros."
        />
        <Paginacion
          paginaActual={listado.pagina}
          totalRegistros={listado.totalRegistros}
          alCambiarPagina={listado.setPagina}
        />
      </EstadoCarga>

      <ModalConfirmacion
        visible={Boolean(nidoPorEliminar)}
        titulo="Eliminar nido"
        mensaje={`¿Seguro que desea eliminar el nido ${nidoPorEliminar?.codigo}? Esta acción no se puede deshacer.`}
        procesando={eliminando}
        alConfirmar={confirmarEliminacion}
        alCancelar={() => setNidoPorEliminar(null)}
      />
    </>
  );
}