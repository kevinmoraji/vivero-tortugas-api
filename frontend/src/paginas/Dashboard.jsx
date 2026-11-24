import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { reportesApi } from "../api/servicios";
import { textoDelError } from "../api/errores";
import { useSesion } from "../contextos/ContextoSesion";
import { formatearFecha } from "../utilidades/formatos";
import EstadoCarga from "../componentes/EstadoCarga";

const NOMBRES_DE_MES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"];

// "2026-11" → "Nov 2026"
function nombreDelMes(textoMes) {
  const [anio, mes] = textoMes.split("-");
  return `${NOMBRES_DE_MES[Number(mes) - 1]} ${anio}`;
}

function TarjetaIndicador({ titulo, valor, icono, color }) {
  return (
    <div className="col-6 col-lg-3">
      <div className="card h-100">
        <div className="card-body d-flex align-items-center gap-3">
          <i className={`bi ${icono} text-${color}`} style={{ fontSize: "2rem" }} />
          <div>
            <div className="h4 mb-0">{valor}</div>
            <small className="text-muted">{titulo}</small>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { usuario } = useSesion();
  const [reportes, setReportes] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargarReportes = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      // Los cuatro reportes se piden al mismo tiempo
      const [resumenPorPlaya, proximosAEclosionar, ocupacionVivero, liberacionesPorMes] = await Promise.all([
        reportesApi.resumenPlayas(),
        reportesApi.proximosAEclosionar(),
        reportesApi.ocupacionVivero(),
        reportesApi.liberacionesPorMes(),
      ]);
      setReportes({ resumenPorPlaya, proximosAEclosionar, ocupacionVivero, liberacionesPorMes });
    } catch (errorDeCarga) {
      setError(textoDelError(errorDeCarga));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarReportes();
  }, [cargarReportes]);

  // Totales de todas las playas para las tarjetas de arriba
  const totales = reportes
    ? reportes.resumenPorPlaya.reduce(
        (acumulado, playa) => ({
          nidos: acumulado.nidos + playa.total_nidos,
          incubando: acumulado.incubando + playa.nidos_incubando,
          criasVivas: acumulado.criasVivas + playa.crias_vivas,
        }),
        { nidos: 0, incubando: 0, criasVivas: 0 },
      )
    : null;

  const totalCriasLiberadas = reportes
    ? reportes.liberacionesPorMes.reduce((suma, mes) => suma + mes.crias, 0)
    : 0;

  const mayorCantidadEnUnMes = reportes
    ? Math.max(1, ...reportes.liberacionesPorMes.map((mes) => mes.crias))
    : 1;

  return (
    <>
      <h1 className="h3 mb-1">
        <i className="bi bi-speedometer2 me-2" />
        Inicio
      </h1>
      <p className="text-muted">Hola, {usuario}. Este es el estado actual del vivero.</p>

      <EstadoCarga cargando={cargando} error={error} alReintentar={cargarReportes}>
        {reportes && (
          <>
            <div className="row g-3 mb-4">
              <TarjetaIndicador titulo="Nidos registrados" valor={totales.nidos} icono="bi-egg" color="success" />
              <TarjetaIndicador titulo="Nidos incubando" valor={totales.incubando} icono="bi-hourglass-split" color="warning" />
              <TarjetaIndicador titulo="Crías nacidas vivas" valor={totales.criasVivas} icono="bi-stars" color="primary" />
              <TarjetaIndicador titulo="Crías liberadas al mar" valor={totalCriasLiberadas} icono="bi-water" color="info" />
            </div>

            <div className="row g-3">
              <div className="col-lg-7">
                <div className="card h-100">
                  <div className="card-header">Resumen por playa</div>
                  <div className="table-responsive">
                    <table className="table mb-0 align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Playa</th>
                          <th>Nidos</th>
                          <th>Incubando</th>
                          <th>Crías vivas</th>
                          <th>Tasa de eclosión</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportes.resumenPorPlaya.map((playa) => (
                          <tr key={playa.playa}>
                            <td>{playa.playa}</td>
                            <td>{playa.total_nidos}</td>
                            <td>{playa.nidos_incubando}</td>
                            <td>{playa.crias_vivas}</td>
                            <td>{playa.tasa_eclosion === null ? "—" : `${playa.tasa_eclosion} %`}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="col-lg-5">
                <div className="card h-100">
                  <div className="card-header">Ocupación del vivero</div>
                  <div className="card-body">
                    {reportes.ocupacionVivero.map((vivero) => (
                      <div key={vivero.playa} className="mb-3">
                        <div className="d-flex justify-content-between">
                          <span>{vivero.playa}</span>
                          <small className="text-muted">
                            {vivero.ocupados.length} ocupados, {vivero.libres.length} libres
                          </small>
                        </div>
                        <div className="progress" role="progressbar" aria-valuenow={vivero.porcentaje_ocupacion}>
                          <div
                            className={`progress-bar ${vivero.porcentaje_ocupacion >= 80 ? "bg-danger" : "bg-success"}`}
                            style={{ width: `${vivero.porcentaje_ocupacion}%` }}
                          >
                            {vivero.porcentaje_ocupacion} %
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="col-lg-7">
                <div className="card h-100">
                  <div className="card-header">Nidos próximos a eclosionar</div>
                  {reportes.proximosAEclosionar.length === 0 ? (
                    <p className="text-muted m-3">No hay nidos cerca de eclosionar.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table mb-0 align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Nido</th>
                            <th>Playa</th>
                            <th>Sector</th>
                            <th>Siembra</th>
                            <th>Días</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportes.proximosAEclosionar.slice(0, 8).map((nido) => (
                            <tr key={nido.id}>
                              <td>
                                <Link to={`/nidos/${nido.id}`}>{nido.codigo}</Link>
                              </td>
                              <td>{nido.playa}</td>
                              <td>{nido.sector}</td>
                              <td>{formatearFecha(nido.fecha_siembra)}</td>
                              <td>
                                <span className="badge text-bg-warning">{nido.dias_incubacion}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="col-lg-5">
                <div className="card h-100">
                  <div className="card-header">Crías liberadas por mes</div>
                  <div className="card-body">
                    {reportes.liberacionesPorMes.length === 0 && (
                      <p className="text-muted mb-0">Todavía no hay liberaciones registradas.</p>
                    )}
                    {reportes.liberacionesPorMes.map((mes) => (
                      <div key={mes.mes} className="d-flex align-items-center gap-2 mb-2">
                        <span className="text-nowrap" style={{ width: 80 }}>{nombreDelMes(mes.mes)}</span>
                        <div className="flex-grow-1 bg-light rounded">
                          <div
                            className="bg-info rounded text-end pe-2 small"
                            style={{ width: `${(mes.crias * 100) / mayorCantidadEnUnMes}%`, minWidth: "2.5rem" }}
                          >
                            {mes.crias}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </EstadoCarga>
    </>
  );
}