import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { listarParaSelector, nidosApi, playasApi, sectoresApi, turnosApi } from "../../api/servicios";
import { interpretarError, textoDelError } from "../../api/errores";
import { useAvisos } from "../../contextos/ContextoAvisos";
import { ESPECIES, fechaDeHoy, formatearFechaHora } from "../../utilidades/formatos";
import CampoFormulario from "../../componentes/CampoFormulario";
import EstadoCarga from "../../componentes/EstadoCarga";

const NIDO_VACIO = {
  codigo: "",
  especie: "",
  playa: "",
  turno: "",
  sector: "",
  fecha_siembra: fechaDeHoy(),
  huevos: "",
  observaciones: "",
};

const CAMPOS_BLOQUEADOS_AL_CERRAR = ["especie", "playa", "turno", "sector", "fecha_siembra", "huevos"];


export default function FormularioNido() {
  const { id: idDelNido } = useParams();
  const esEdicion = Boolean(idDelNido);
  const navegar = useNavigate();
  const { mostrarExito, mostrarError } = useAvisos();

  const [datosDelNido, setDatosDelNido] = useState(NIDO_VACIO);
  const [estadoDelNido, setEstadoDelNido] = useState("INCUBANDO");
  const [sectorOriginal, setSectorOriginal] = useState("");
  const [playas, setPlayas] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [erroresPorCampo, setErroresPorCampo] = useState({});
  const [cargando, setCargando] = useState(true);
  const [errorDeCarga, setErrorDeCarga] = useState("");
  const [guardando, setGuardando] = useState(false);

  const nidoCerrado = estadoDelNido !== "INCUBANDO";

  
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        setPlayas(await listarParaSelector(playasApi, { ordering: "nombre" }));
        if (esEdicion) {
          const nido = await nidosApi.obtener(idDelNido);
          setDatosDelNido({
            codigo: nido.codigo,
            especie: nido.especie,
            playa: String(nido.playa),
            turno: String(nido.turno),
            sector: String(nido.sector),
            fecha_siembra: nido.fecha_siembra,
            huevos: String(nido.huevos),
            observaciones: nido.observaciones,
          });
          setEstadoDelNido(nido.estado);
          setSectorOriginal(String(nido.sector));
        }
      } catch (error) {
        setErrorDeCarga(textoDelError(error));
      } finally {
        setCargando(false);
      }
    };
    cargarDatosIniciales();
  }, [esEdicion, idDelNido]);

  
  useEffect(() => {
    if (!datosDelNido.playa) {
      setTurnos([]);
      setSectores([]);
      return;
    }
    const filtroDePlaya = { playa: datosDelNido.playa };
    Promise.all([
      listarParaSelector(turnosApi, { ...filtroDePlaya, ordering: "-inicio" }),
      listarParaSelector(sectoresApi, { ...filtroDePlaya, ordering: "codigo" }),
    ])
      .then(([turnosDeLaPlaya, sectoresDeLaPlaya]) => {
        setTurnos(turnosDeLaPlaya);
        setSectores(sectoresDeLaPlaya);
      })
      .catch((error) => setErrorDeCarga(textoDelError(error)));
  }, [datosDelNido.playa]);

  const manejarCambio = (evento) => {
    const { name: nombreDelCampo, value: valor } = evento.target;
    setDatosDelNido((datosAnteriores) => {
      const datosNuevos = { ...datosAnteriores, [nombreDelCampo]: valor };
      
      if (nombreDelCampo === "playa") {
        datosNuevos.turno = "";
        datosNuevos.sector = "";
      }
      
      if (nombreDelCampo === "turno") {
        const turnoElegido = turnos.find((turno) => String(turno.id) === valor);
        if (turnoElegido) datosNuevos.fecha_siembra = turnoElegido.inicio.slice(0, 10);
      }
      return datosNuevos;
    });
    setErroresPorCampo((erroresAnteriores) => ({ ...erroresAnteriores, [nombreDelCampo]: "" }));
  };

  const manejarEnvio = async (evento) => {
    evento.preventDefault();
    setGuardando(true);
    setErroresPorCampo({});
    const datosParaEnviar = {
      ...datosDelNido,
      playa: Number(datosDelNido.playa) || null,
      turno: Number(datosDelNido.turno) || null,
      sector: Number(datosDelNido.sector) || null,
      huevos: Number(datosDelNido.huevos) || null,
    };
    try {
      const nidoGuardado = esEdicion
        ? await nidosApi.actualizar(idDelNido, datosParaEnviar)
        : await nidosApi.crear(datosParaEnviar);
      mostrarExito(esEdicion ? "Nido actualizado." : `Nido ${nidoGuardado.codigo} registrado.`);
      navegar(`/nidos/${nidoGuardado.id}`);
    } catch (errorAlGuardar) {
      const { mensaje, erroresPorCampo: erroresDeDjango } = interpretarError(errorAlGuardar);
      setErroresPorCampo(erroresDeDjango);
      mostrarError(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  
  const opcionesDeSector = sectores
    .filter((sector) => String(sector.id) === sectorOriginal || (sector.activo && !sector.ocupado))
    .map((sector) => ({ valor: String(sector.id), texto: sector.codigo }));

  const opcionesDeTurno = turnos.map((turno) => ({
    valor: String(turno.id),
    texto: `${formatearFechaHora(turno.inicio)} a ${formatearFechaHora(turno.fin).slice(-5)}`,
  }));

  const opcionesDePlaya = playas.map((playa) => ({ valor: String(playa.id), texto: playa.nombre }));

  const estaBloqueado = (nombreDelCampo) => nidoCerrado && CAMPOS_BLOQUEADOS_AL_CERRAR.includes(nombreDelCampo);

  return (
    <>
      <h1 className="h3 mb-3">
        <i className="bi bi-egg me-2" />
        {esEdicion ? "Editar nido" : "Registrar nido"}
      </h1>

      <EstadoCarga cargando={cargando} error={errorDeCarga}>
        {nidoCerrado && (
          <div className="alert alert-info">
            Este nido ya está cerrado ({estadoDelNido.toLowerCase()}). Solo se pueden cambiar el código y las observaciones.
          </div>
        )}

        <form className="card card-body" onSubmit={manejarEnvio} noValidate>
          <div className="row">
            <div className="col-md-6">
              <CampoFormulario
                etiqueta="Código"
                nombre="codigo"
                valor={datosDelNido.codigo}
                alCambiar={manejarCambio}
                error={erroresPorCampo.codigo}
                placeholder="Ej.: OST-2026-001"
                requerido
              />
            </div>
            <div className="col-md-6">
              <CampoFormulario
                etiqueta="Especie"
                nombre="especie"
                valor={datosDelNido.especie}
                alCambiar={manejarCambio}
                error={erroresPorCampo.especie}
                opciones={ESPECIES}
                disabled={estaBloqueado("especie")}
                requerido
              />
            </div>

            <div className="col-md-4">
              <CampoFormulario
                etiqueta="Playa"
                nombre="playa"
                valor={datosDelNido.playa}
                alCambiar={manejarCambio}
                error={erroresPorCampo.playa}
                opciones={opcionesDePlaya}
                disabled={estaBloqueado("playa")}
                requerido
              />
            </div>
            <div className="col-md-4">
              <CampoFormulario
                etiqueta="Turno en que se encontró"
                nombre="turno"
                valor={datosDelNido.turno}
                alCambiar={manejarCambio}
                error={erroresPorCampo.turno}
                opciones={opcionesDeTurno}
                disabled={!datosDelNido.playa || estaBloqueado("turno")}
                requerido
              />
            </div>
            <div className="col-md-4">
              <CampoFormulario
                etiqueta="Sector del vivero"
                nombre="sector"
                valor={datosDelNido.sector}
                alCambiar={manejarCambio}
                error={erroresPorCampo.sector}
                opciones={opcionesDeSector}
                disabled={!datosDelNido.playa || estaBloqueado("sector")}
                requerido
              />
            </div>

            <div className="col-md-6">
              <CampoFormulario
                etiqueta="Fecha de siembra"
                nombre="fecha_siembra"
                tipo="date"
                valor={datosDelNido.fecha_siembra}
                alCambiar={manejarCambio}
                error={erroresPorCampo.fecha_siembra}
                max={fechaDeHoy()}
                disabled={estaBloqueado("fecha_siembra")}
                requerido
              />
            </div>
            <div className="col-md-6">
              <CampoFormulario
                etiqueta="Cantidad de huevos"
                nombre="huevos"
                tipo="number"
                valor={datosDelNido.huevos}
                alCambiar={manejarCambio}
                error={erroresPorCampo.huevos}
                min={1}
                max={200}
                disabled={estaBloqueado("huevos")}
                requerido
              />
            </div>

            <div className="col-12">
              <CampoFormulario
                etiqueta="Observaciones"
                nombre="observaciones"
                tipo="textarea"
                valor={datosDelNido.observaciones}
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
            <Link to={esEdicion ? `/nidos/${idDelNido}` : "/nidos"} className="btn btn-outline-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </EstadoCarga>
    </>
  );
}