import { useState } from "react";
import { Link } from "react-router-dom";

import { voluntariosApi } from "../../api/servicios";
import { textoDelError } from "../../api/errores";
import { useSesion } from "../../contextos/ContextoSesion";
import { useAvisos } from "../../contextos/ContextoAvisos";
import { useListadoPaginado } from "../../ganchos/useListadoPaginado";
import { puedeCrear, puedeEditar, puedeEliminar } from "../../utilidades/permisos";
import { formatearFecha } from "../../utilidades/formatos";
import Tabla from "../../componentes/Tabla";
import Paginacion from "../../componentes/Paginacion";
import EstadoCarga from "../../componentes/EstadoCarga";
import ModalConfirmacion from "../../componentes/ModalConfirmacion";

const OPCIONES_DE_ORDEN = [
  { valor: "apellidos", texto: "Apellidos (A-Z)" },
  { valor: "-apellidos", texto: "Apellidos (Z-A)" },
  { valor: "-num_turnos", texto: "Más turnos primero" },
  { valor: "fecha_ingreso", texto: "Más antiguos primero" },
  { valor: "-fecha_ingreso", texto: "Más recientes primero" },
];

export default function Voluntarios() {
  const { roles } = useSesion();
  const { mostrarExito, mostrarError } = useAvisos();
  const listado = useListadoPaginado(voluntariosApi, { search: "", activo: "", ordering: "apellidos" });

  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [voluntarioPorEliminar, setVoluntarioPorEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const confirmarEliminacion = async () => {
    setEliminando(true);
    try {
      await voluntariosApi.eliminar(voluntarioPorEliminar.id);
      mostrarExito(`${voluntarioPorEliminar.nombre} ${voluntarioPorEliminar.apellidos} fue eliminado.`);
      listado.recargar();
    } catch (errorAlEliminar) {
      // Si el voluntario ya tiene turnos o liberaciones, el backend responde 409
      mostrarError(textoDelError(errorAlEliminar));
    } finally {
      setVoluntarioPorEliminar(null);
      setEliminando(false);
    }
  };

  const columnas = [
    { titulo: "Cédula", mostrar: (voluntario) => voluntario.cedula },
    { titulo: "Nombre", mostrar: (voluntario) => `${voluntario.apellidos}, ${voluntario.nombre}` },
    { titulo: "Correo", mostrar: (voluntario) => voluntario.email },
    { titulo: "Teléfono", mostrar: (voluntario) => voluntario.telefono || "—" },
    { titulo: "Ingreso", mostrar: (voluntario) => formatearFecha(voluntario.fecha_ingreso) },
    { titulo: "Turnos", mostrar: (voluntario) => voluntario.total_turnos },
    {
      titulo: "Estado",
      mostrar: (voluntario) =>
        voluntario.activo ? (
          <span className="badge text-bg-success">Activo</span>
        ) : (
          <span className="badge text-bg-secondary">Inactivo</span>
        ),
    },
  ];

  const usuarioPuedeEditar = puedeEditar(roles, "voluntarios");
  const usuarioPuedeEliminar = puedeEliminar(roles, "voluntarios");

  const accionesDeLaFila =
    usuarioPuedeEditar || usuarioPuedeEliminar
      ? (voluntario) => (
          <>
            {usuarioPuedeEditar && (
              <Link
                to={`/voluntarios/${voluntario.id}/editar`}
                className="btn btn-outline-primary btn-sm me-1"
                title="Editar"
              >
                <i className="bi bi-pencil" />
              </Link>
            )}
            {usuarioPuedeEliminar && (
              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                title="Eliminar"
                onClick={() => setVoluntarioPorEliminar(voluntario)}
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
          <i className="bi bi-people me-2" />
          Voluntarios
        </h1>
        {puedeCrear(roles, "voluntarios") && (
          <Link to="/voluntarios/nuevo" className="btn btn-success">
            <i className="bi bi-plus-lg me-1" />
            Nuevo voluntario
          </Link>
        )}
      </div>

      <form
        className="row g-2 mb-3"
        onSubmit={(evento) => {
          evento.preventDefault();
          listado.cambiarFiltro("search", textoBusqueda.trim());
        }}
      >
        <div className="col-md-6">
          <div className="input-group">
            <input
              className="form-control"
              placeholder="Buscar por nombre, apellidos, cédula o correo"
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
            value={listado.filtros.activo}
            onChange={(evento) => listado.cambiarFiltro("activo", evento.target.value)}
          >
            <option value="">Activos e inactivos</option>
            <option value="true">Solo activos</option>
            <option value="false">Solo inactivos</option>
          </select>
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
      </form>

      <EstadoCarga cargando={listado.cargando} error={listado.error} alReintentar={listado.recargar}>
        <Tabla
          columnas={columnas}
          filas={listado.registros}
          acciones={accionesDeLaFila}
          textoVacio="No hay voluntarios que coincidan con la búsqueda."
        />
        <Paginacion
          paginaActual={listado.pagina}
          totalRegistros={listado.totalRegistros}
          alCambiarPagina={listado.setPagina}
        />
      </EstadoCarga>

      <ModalConfirmacion
        visible={Boolean(voluntarioPorEliminar)}
        titulo="Eliminar voluntario"
        mensaje={`¿Seguro que desea eliminar a ${voluntarioPorEliminar?.nombre} ${voluntarioPorEliminar?.apellidos}? Si ya participó en turnos no se podrá eliminar; en ese caso márquelo como inactivo.`}
        procesando={eliminando}
        alConfirmar={confirmarEliminacion}
        alCancelar={() => setVoluntarioPorEliminar(null)}
      />
    </>
  );
}