import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { eclosionesApi, listarParaSelector, nidosApi, playasApi } from "../../api/servicios";
import { interpretarError, textoDelError } from "../../api/errores";
import { useSesion } from "../../contextos/ContextoSesion";
import { useAvisos } from "../../contextos/ContextoAvisos";
import { useListadoPaginado } from "../../ganchos/useListadoPaginado";
import { puedeCrear, puedeEditar, puedeEliminar } from "../../utilidades/permisos";
import { fechaDeHoy, formatearFecha } from "../../utilidades/formatos";
import Tabla from "../../componentes/Tabla";
import Paginacion from "../../componentes/Paginacion";
import EstadoCarga from "../../componentes/EstadoCarga";
import ModalConfirmacion from "../../componentes/ModalConfirmacion";
import CampoFormulario from "../../componentes/CampoFormulario";

const ECLOSION_VACIA = {
  nido: "",
  fecha: fechaDeHoy(),
  crias_vivas: "",
  crias_muertas: "0",
  huevos_sin_desarrollo: "0",
  observaciones: "",
};

const FILTROS_INICIALES = { nido__playa: "", fecha__gte: "", fecha__lte: "", ordering: "-fecha" };

export default function Eclosiones() {
  const { roles } = useSesion();
  const { mostrarExito, mostrarError } = useAvisos();
  const listado = useListadoPaginado(eclosionesApi, FILTROS_INICIALES);

  const [playas, setPlayas] = useState([]);
  const [nidosIncubando, setNidosIncubando] = useState([]);
  const [formularioVisible, setFormularioVisible] = useState(false);
  const [eclosionEnEdicion, setEclosionEnEdicion] = useState(null);
  const [datosDeLaEclosion, setDatosDeLaEclosion] = useState(ECLOSION_VACIA);
  const [erroresPorCampo, setErroresPorCampo] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [eclosionPorEliminar, setEclosionPorEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    listarParaSelector(playasApi)
      .then(setPlayas)
      .catch(() => setPlayas([]));
  }, []);

  // Solo los nidos que están incubando pueden eclosionar
  const cargarNidosIncubando = () =>
    listarParaSelector(nidosApi, { estado: "INCUBANDO", ordering: "fecha_siembra" })
      .then(setNidosIncubando)
      .catch(() => setNidosIncubando([]));

  const abrirParaCrear = () => {
    setEclosionEnEdicion(null);
    setDatosDeLaEclosion(ECLOSION_VACIA);
    setErroresPorCampo({});
    cargarNidosIncubando();
    setFormularioVisible(true);
  };

  const abrirParaEditar = (eclosion) => {
    setEclosionEnEdicion(eclosion);
    setDatosDeLaEclosion({
      nido: String(eclosion.nido),
      fecha: eclosion.fecha,
      crias_vivas: String(eclosion.crias_vivas),
      crias_muertas: String(eclosion.crias_muertas),
      huevos_sin_desarrollo: String(eclosion.huevos_sin_desarrollo),
      observaciones: eclosion.observaciones,
    });
    setErroresPorCampo({});
    setFormularioVisible(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const manejarCambio = (evento) => {
    const { name: nombreDelCampo, value: valor } = evento.target;
    setDatosDeLaEclosion((datosAnteriores) => ({ ...datosAnteriores, [nombreDelCampo]: valor }));
    setErroresPorCampo((erroresAnteriores) => ({ ...erroresAnteriores, [nombreDelCampo]: "" }));
  };

  const guardarEclosion = async (evento) => {
    evento.preventDefault();
    setGuardando(true);
    setErroresPorCampo({});
    const datosParaEnviar = {
      ...datosDeLaEclosion,
      nido: Number(datosDeLaEclosion.nido) || null,
      crias_vivas: datosDeLaEclosion.crias_vivas === "" ? null : Number(datosDeLaEclosion.crias_vivas),
      crias_muertas: Number(datosDeLaEclosion.crias_muertas) || 0,
      huevos_sin_desarrollo: Number(datosDeLaEclosion.huevos_sin_desarrollo) || 0,
    };
    try {
      if (eclosionEnEdicion) {
        await eclosionesApi.actualizar(eclosionEnEdicion.id, datosParaEnviar);
        mostrarExito("Eclosión actualizada.");
      } else {
        await eclosionesApi.crear(datosParaEnviar);
        mostrarExito("Eclosión registrada. El nido quedó como eclosionado y su sector se liberó.");
      }
      setFormularioVisible(false);
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
      await eclosionesApi.eliminar(eclosionPorEliminar.id);
      mostrarExito(`Eclosión de ${eclosionPorEliminar.nido_codigo} anulada. El nido volvió a incubando.`);
      listado.recargar();
    } catch (errorAlEliminar) {
      // Si ya tiene liberaciones, el backend responde 409
      mostrarError(textoDelError(errorAlEliminar));
    } finally {
      setEclosionPorEliminar(null);
      setEliminando(false);
    }
  };

  const limpiarFiltros = () => {
    Object.entries(FILTROS_INICIALES).forEach(([nombreDelFiltro, valor]) => listado.cambiarFiltro(nombreDelFiltro, valor));
  };

  // Ayuda para el usuario: cuántos huevos tiene el nido elegido
  const nidoElegido = eclosionEnEdicion
    ? { codigo: eclosionEnEdicion.nido_codigo, huevos: eclosionEnEdicion.huevos_sembrados }
    : nidosIncubando.find((nido) => String(nido.id) === datosDeLaEclosion.nido);
  const sumaDelConteo =
    (Number(datosDeLaEclosion.crias_vivas) || 0) +
    (Number(datosDeLaEclosion.crias_muertas) || 0) +
    (Number(datosDeLaEclosion.huevos_sin_desarrollo) || 0);

  const opcionesDeNido = eclosionEnEdicion
    ? [{ valor: String(eclosionEnEdicion.nido), texto: eclosionEnEdicion.nido_codigo }]
    : nidosIncubando.map((nido) => ({
        valor: String(nido.id),
        texto: `${nido.codigo} · ${nido.playa_nombre} · ${nido.dias_incubacion} días`,
      }));

  const columnas = [
    {
      titulo: "Nido",
      mostrar: (eclosion) => <Link to={`/nidos/${eclosion.nido}`}>{eclosion.nido_codigo}</Link>,
    },
    { titulo: "Fecha", mostrar: (eclosion) => formatearFecha(eclosion.fecha) },
    { titulo: "Huevos", mostrar: (eclosion) => eclosion.huevos_sembrados },
    { titulo: "Vivas", mostrar: (eclosion) => eclosion.crias_vivas },
    { titulo: "Muertas", mostrar: (eclosion) => eclosion.crias_muertas },
    { titulo: "Sin desarrollo", mostrar: (eclosion) => eclosion.huevos_sin_desarrollo },
    { titulo: "Tasa", mostrar: (eclosion) => `${eclosion.tasa_eclosion} %` },
    {
      titulo: "Por liberar",
      mostrar: (eclosion) =>
        eclosion.crias_pendientes > 0 ? (
          <span className="badge text-bg-warning">{eclosion.crias_pendientes}</span>
        ) : (
          <span className="badge text-bg-success">Todas liberadas</span>
        ),
    },
  ];

  const usuarioPuedeEditar = puedeEditar(roles, "eclosiones");
  const usuarioPuedeEliminar = puedeEliminar(roles, "eclosiones");

  const accionesDeLaFila =
    usuarioPuedeEditar || usuarioPuedeEliminar
      ? (eclosion) => (
          <>
            {usuarioPuedeEditar && (
              <button
                type="button"
                className="btn btn-outline-primary btn-sm me-1"
                title="Editar"
                onClick={() => abrirParaEditar(eclosion)}
              >
                <i className="bi bi-pencil" />
              </button>
            )}
            {usuarioPuedeEliminar && (
              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                title="Anular"
                onClick={() => setEclosionPorEliminar(eclosion)}
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
          <i className="bi bi-stars me-2" />
          Eclosiones
        </h1>
        {puedeCrear(roles, "eclosiones") && !formularioVisible && (
          <button type="button" className="btn btn-success" onClick={abrirParaCrear}>
            <i className="bi bi-plus-lg me-1" />
            Registrar eclosión
          </button>
        )}
      </div>

      {formularioVisible && (
        <form className="card mb-3" onSubmit={guardarEclosion} noValidate>
          <div className="card-header">
            {eclosionEnEdicion ? `Editar eclosión de ${eclosionEnEdicion.nido_codigo}` : "Registrar eclosión"}
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-8">
                <CampoFormulario
                  etiqueta="Nido (solo los que están incubando)"
                  nombre="nido"
                  valor={datosDeLaEclosion.nido}
                  alCambiar={manejarCambio}
                  error={erroresPorCampo.nido}
                  opciones={opcionesDeNido}
                  disabled={Boolean(eclosionEnEdicion)}
                  requerido
                />
              </div>
              <div className="col-md-4">
                <CampoFormulario
                  etiqueta="Fecha de eclosión"
                  nombre="fecha"
                  tipo="date"
                  valor={datosDeLaEclosion.fecha}
                  alCambiar={manejarCambio}
                  error={erroresPorCampo.fecha}
                  max={fechaDeHoy()}
                  requerido
                />
              </div>
              <div className="col-md-4">
                <CampoFormulario
                  etiqueta="Crías vivas"
                  nombre="crias_vivas"
                  tipo="number"
                  min={0}
                  valor={datosDeLaEclosion.crias_vivas}
                  alCambiar={manejarCambio}
                  error={erroresPorCampo.crias_vivas}
                  requerido
                />
              </div>
              <div className="col-md-4">
                <CampoFormulario
                  etiqueta="Crías muertas"
                  nombre="crias_muertas"
                  tipo="number"
                  min={0}
                  valor={datosDeLaEclosion.crias_muertas}
                  alCambiar={manejarCambio}
                  error={erroresPorCampo.crias_muertas}
                />
              </div>
              <div className="col-md-4">
                <CampoFormulario
                  etiqueta="Huevos sin desarrollo"
                  nombre="huevos_sin_desarrollo"
                  tipo="number"
                  min={0}
                  valor={datosDeLaEclosion.huevos_sin_desarrollo}
                  alCambiar={manejarCambio}
                  error={erroresPorCampo.huevos_sin_desarrollo}
                />
              </div>
              {nidoElegido && (
                <div className="col-12 mb-3">
                  <small className={sumaDelConteo === nidoElegido.huevos ? "text-success" : "text-muted"}>
                    El nido {nidoElegido.codigo} tiene {nidoElegido.huevos} huevos. La suma actual es {sumaDelConteo}.
                  </small>
                </div>
              )}
              <div className="col-12">
                <CampoFormulario
                  etiqueta="Observaciones"
                  nombre="observaciones"
                  tipo="textarea"
                  valor={datosDeLaEclosion.observaciones}
                  alCambiar={manejarCambio}
                  error={erroresPorCampo.observaciones}
                />
              </div>
            </div>
            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-success" disabled={guardando}>
                {guardando && <span className="spinner-border spinner-border-sm me-2" />}
                Guardar
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setFormularioVisible(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="card mb-3">
        <div className="card-body row g-2">
          <div className="col-md-4">
            <select
              className="form-select"
              value={listado.filtros.nido__playa}
              onChange={(evento) => listado.cambiarFiltro("nido__playa", evento.target.value)}
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
            <input
              type="date"
              className="form-control"
              title="Desde"
              value={listado.filtros.fecha__gte}
              onChange={(evento) => listado.cambiarFiltro("fecha__gte", evento.target.value)}
            />
          </div>
          <div className="col-md-3">
            <input
              type="date"
              className="form-control"
              title="Hasta"
              value={listado.filtros.fecha__lte}
              onChange={(evento) => listado.cambiarFiltro("fecha__lte", evento.target.value)}
            />
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
          textoVacio="No hay eclosiones con esos filtros."
        />
        <Paginacion
          paginaActual={listado.pagina}
          totalRegistros={listado.totalRegistros}
          alCambiarPagina={listado.setPagina}
        />
      </EstadoCarga>

      <ModalConfirmacion
        visible={Boolean(eclosionPorEliminar)}
        titulo="Anular eclosión"
        mensaje={`¿Anular la eclosión del nido ${eclosionPorEliminar?.nido_codigo}? El nido volverá a quedar incubando. No se puede anular si ya tiene liberaciones.`}
        textoConfirmar="Anular"
        procesando={eliminando}
        alConfirmar={confirmarEliminacion}
        alCancelar={() => setEclosionPorEliminar(null)}
      />
    </>
  );
}