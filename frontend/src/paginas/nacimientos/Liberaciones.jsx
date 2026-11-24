import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { eclosionesApi, liberacionesApi, listarParaSelector, playasApi, voluntariosApi } from "../../api/servicios";
import { interpretarError } from "../../api/errores";
import { useSesion } from "../../contextos/ContextoSesion";
import { useAvisos } from "../../contextos/ContextoAvisos";
import { useListadoPaginado } from "../../ganchos/useListadoPaginado";
import { puedeCrear } from "../../utilidades/permisos";
import { fechaDeHoy, formatearFecha } from "../../utilidades/formatos";
import Tabla from "../../componentes/Tabla";
import Paginacion from "../../componentes/Paginacion";
import EstadoCarga from "../../componentes/EstadoCarga";
import CampoFormulario from "../../componentes/CampoFormulario";

const LIBERACION_VACIA = { eclosion: "", responsable: "", fecha: fechaDeHoy(), cantidad: "", observaciones: "" };

// Las liberaciones solo se crean y se consultan: el backend no permite editarlas ni borrarlas,
// porque son el registro final de las crías que llegaron al mar.
export default function Liberaciones() {
  const { roles } = useSesion();
  const { mostrarExito, mostrarError } = useAvisos();
  const listado = useListadoPaginado(liberacionesApi, { eclosion__nido__playa: "", ordering: "-fecha" });

  const [playas, setPlayas] = useState([]);
  const [eclosionesConPendientes, setEclosionesConPendientes] = useState([]);
  const [voluntariosActivos, setVoluntariosActivos] = useState([]);
  const [formularioVisible, setFormularioVisible] = useState(false);
  const [datosDeLaLiberacion, setDatosDeLaLiberacion] = useState(LIBERACION_VACIA);
  const [erroresPorCampo, setErroresPorCampo] = useState({});
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    listarParaSelector(playasApi)
      .then(setPlayas)
      .catch(() => setPlayas([]));
  }, []);

  const abrirFormulario = async () => {
    setDatosDeLaLiberacion(LIBERACION_VACIA);
    setErroresPorCampo({});
    setFormularioVisible(true);
    try {
      const [eclosiones, voluntarios] = await Promise.all([
        listarParaSelector(eclosionesApi, { ordering: "-fecha" }),
        listarParaSelector(voluntariosApi, { activo: true, ordering: "apellidos" }),
      ]);
      // Solo se ofrecen las eclosiones que todavía tienen crías por liberar
      setEclosionesConPendientes(eclosiones.filter((eclosion) => eclosion.crias_pendientes > 0));
      setVoluntariosActivos(voluntarios);
    } catch {
      mostrarError("No se pudieron cargar las eclosiones o los voluntarios.");
    }
  };

  const manejarCambio = (evento) => {
    const { name: nombreDelCampo, value: valor } = evento.target;
    setDatosDeLaLiberacion((datosAnteriores) => ({ ...datosAnteriores, [nombreDelCampo]: valor }));
    setErroresPorCampo((erroresAnteriores) => ({ ...erroresAnteriores, [nombreDelCampo]: "" }));
  };

  const eclosionElegida = eclosionesConPendientes.find(
    (eclosion) => String(eclosion.id) === datosDeLaLiberacion.eclosion,
  );

  const guardarLiberacion = async (evento) => {
    evento.preventDefault();
    setGuardando(true);
    setErroresPorCampo({});
    const datosParaEnviar = {
      ...datosDeLaLiberacion,
      eclosion: Number(datosDeLaLiberacion.eclosion) || null,
      responsable: Number(datosDeLaLiberacion.responsable) || null,
      cantidad: datosDeLaLiberacion.cantidad === "" ? null : Number(datosDeLaLiberacion.cantidad),
    };
    try {
      const liberacionGuardada = await liberacionesApi.crear(datosParaEnviar);
      mostrarExito(`Se registró la liberación de ${liberacionGuardada.cantidad} crías del nido ${liberacionGuardada.nido_codigo}.`);
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

  const opcionesDeEclosion = eclosionesConPendientes.map((eclosion) => ({
    valor: String(eclosion.id),
    texto: `${eclosion.nido_codigo} · nació el ${formatearFecha(eclosion.fecha)} · ${eclosion.crias_pendientes} por liberar`,
  }));

  const opcionesDeResponsable = voluntariosActivos.map((voluntario) => ({
    valor: String(voluntario.id),
    texto: `${voluntario.apellidos}, ${voluntario.nombre}`,
  }));

  const columnas = [
    { titulo: "Fecha", mostrar: (liberacion) => formatearFecha(liberacion.fecha) },
    {
      titulo: "Nido",
      mostrar: (liberacion) => liberacion.nido_codigo,
    },
    { titulo: "Crías liberadas", mostrar: (liberacion) => liberacion.cantidad },
    { titulo: "Responsable", mostrar: (liberacion) => liberacion.responsable_nombre },
    { titulo: "Observaciones", mostrar: (liberacion) => liberacion.observaciones || "—" },
  ];

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">
          <i className="bi bi-water me-2" />
          Liberaciones
        </h1>
        {puedeCrear(roles, "liberaciones") && !formularioVisible && (
          <button type="button" className="btn btn-success" onClick={abrirFormulario}>
            <i className="bi bi-plus-lg me-1" />
            Registrar liberación
          </button>
        )}
      </div>

      {formularioVisible && (
        <form className="card mb-3" onSubmit={guardarLiberacion} noValidate>
          <div className="card-header">Registrar liberación de crías</div>
          <div className="card-body">
            {eclosionesConPendientes.length === 0 && (
              <div className="alert alert-info py-2">
                No hay eclosiones con crías pendientes de liberar. Primero registre una eclosión en{" "}
                <Link to="/eclosiones">Eclosiones</Link>.
              </div>
            )}
            <div className="row">
              <div className="col-md-7">
                <CampoFormulario
                  etiqueta="Eclosión"
                  nombre="eclosion"
                  valor={datosDeLaLiberacion.eclosion}
                  alCambiar={manejarCambio}
                  error={erroresPorCampo.eclosion}
                  opciones={opcionesDeEclosion}
                  requerido
                />
              </div>
              <div className="col-md-5">
                <CampoFormulario
                  etiqueta="Voluntario responsable"
                  nombre="responsable"
                  valor={datosDeLaLiberacion.responsable}
                  alCambiar={manejarCambio}
                  error={erroresPorCampo.responsable}
                  opciones={opcionesDeResponsable}
                  requerido
                />
              </div>
              <div className="col-md-4">
                <CampoFormulario
                  etiqueta="Fecha de liberación"
                  nombre="fecha"
                  tipo="date"
                  valor={datosDeLaLiberacion.fecha}
                  alCambiar={manejarCambio}
                  error={erroresPorCampo.fecha}
                  max={fechaDeHoy()}
                  requerido
                />
              </div>
              <div className="col-md-4">
                <CampoFormulario
                  etiqueta="Cantidad de crías"
                  nombre="cantidad"
                  tipo="number"
                  min={1}
                  max={eclosionElegida?.crias_pendientes}
                  valor={datosDeLaLiberacion.cantidad}
                  alCambiar={manejarCambio}
                  error={erroresPorCampo.cantidad}
                  requerido
                />
              </div>
              {eclosionElegida && (
                <div className="col-md-4 d-flex align-items-center">
                  <small className="text-muted">
                    Quedan {eclosionElegida.crias_pendientes} crías por liberar. Se deben liberar a más tardar 2 días
                    después de la eclosión.
                  </small>
                </div>
              )}
              <div className="col-12">
                <CampoFormulario
                  etiqueta="Observaciones"
                  nombre="observaciones"
                  tipo="textarea"
                  valor={datosDeLaLiberacion.observaciones}
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

      <div className="row g-2 mb-3">
        <div className="col-md-4">
          <select
            className="form-select"
            value={listado.filtros.eclosion__nido__playa}
            onChange={(evento) => listado.cambiarFiltro("eclosion__nido__playa", evento.target.value)}
          >
            <option value="">Todas las playas</option>
            {playas.map((playa) => (
              <option key={playa.id} value={playa.id}>
                {playa.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <EstadoCarga cargando={listado.cargando} error={listado.error} alReintentar={listado.recargar}>
        <Tabla columnas={columnas} filas={listado.registros} textoVacio="Todavía no hay liberaciones registradas." />
        <Paginacion
          paginaActual={listado.pagina}
          totalRegistros={listado.totalRegistros}
          alCambiarPagina={listado.setPagina}
        />
      </EstadoCarga>
    </>
  );
}