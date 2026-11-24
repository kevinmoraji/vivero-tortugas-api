import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useSesion } from "../contextos/ContextoSesion";

const ENLACES_DEL_MENU = [
  { ruta: "/", texto: "Inicio", icono: "bi-speedometer2" },
  { ruta: "/playas", texto: "Playas", icono: "bi-geo-alt" },
  { ruta: "/sectores", texto: "Sectores", icono: "bi-grid-3x3" },
  { ruta: "/voluntarios", texto: "Voluntarios", icono: "bi-people" },
  { ruta: "/turnos", texto: "Turnos", icono: "bi-calendar-week" },
  { ruta: "/nidos", texto: "Nidos", icono: "bi-egg" },
  { ruta: "/eclosiones", texto: "Eclosiones", icono: "bi-stars" },
  { ruta: "/liberaciones", texto: "Liberaciones", icono: "bi-water" },
];

export default function Layout() {
  const { usuario, roles, cerrarSesion } = useSesion();
  const navegar = useNavigate();

  const manejarCierreDeSesion = async () => {
    await cerrarSesion();
    navegar("/login", { replace: true });
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-success">
        <div className="container-fluid">
          <NavLink className="navbar-brand" to="/">
            <i className="bi bi-heart-pulse me-2" />
            Vivero de Tortugas
          </NavLink>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#menu-principal"
            aria-controls="menu-principal"
            aria-expanded="false"
            aria-label="Abrir menú"
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse" id="menu-principal">
            <ul className="navbar-nav me-auto">
              {ENLACES_DEL_MENU.map((enlace) => (
                <li className="nav-item" key={enlace.ruta}>
                  <NavLink className="nav-link" to={enlace.ruta} end={enlace.ruta === "/"}>
                    <i className={`bi ${enlace.icono} me-1`} />
                    {enlace.texto}
                  </NavLink>
                </li>
              ))}
            </ul>
            <span className="navbar-text text-white me-3">
              <i className="bi bi-person-circle me-1" />
              {usuario} ({roles.join(", ")})
            </span>
            <button type="button" className="btn btn-outline-light btn-sm" onClick={manejarCierreDeSesion}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </nav>

      <main className="container py-4">
        <Outlet />
      </main>
    </>
  );
}