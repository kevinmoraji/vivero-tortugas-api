import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { useSesion } from "../contextos/ContextoSesion";
import { textoDelError } from "../api/errores";
import LogoTortuga from "../componentes/LogoTortuga";

export default function Login() {
  const { haySesion, iniciarSesion, avisoDeSesion } = useSesion();
  const navegar = useNavigate();
  const ubicacion = useLocation();

  const [nombreUsuario, setNombreUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mensajeDeError, setMensajeDeError] = useState("");
  const [ingresando, setIngresando] = useState(false);

  // Pantalla a la que quería entrar antes de que lo mandaran al login
  const pantallaDeDestino = ubicacion.state?.desde ?? "/";

  if (haySesion) {
    return <Navigate to={pantallaDeDestino} replace />;
  }

  const manejarIngreso = async (evento) => {
    evento.preventDefault();
    if (!nombreUsuario.trim() || !contrasena) {
      setMensajeDeError("Escriba el usuario y la contraseña.");
      return;
    }
    setMensajeDeError("");
    setIngresando(true);
    try {
      await iniciarSesion(nombreUsuario.trim(), contrasena);
      navegar(pantallaDeDestino, { replace: true });
    } catch (errorDeLogin) {
      setMensajeDeError(textoDelError(errorDeLogin));
      setIngresando(false);
    }
  };

  return (
    <div className="fondo-playa d-flex align-items-center justify-content-center px-3">
      <div className="card tarjeta-login" style={{ maxWidth: 400, width: "100%" }}>
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <LogoTortuga tamano={72} />
            <h1 className="h4 mt-2 mb-0">Vivero de Tortugas</h1>
            <p className="lema-login small mb-1">Cada nido cuenta, cada cría llega al mar</p>
            <p className="text-muted small">Ingrese con su usuario del sistema</p>
          </div>

          {avisoDeSesion && !mensajeDeError && <div className="alert alert-warning py-2">{avisoDeSesion}</div>}
          {mensajeDeError && <div className="alert alert-danger py-2">{mensajeDeError}</div>}

          <form onSubmit={manejarIngreso} noValidate>
            <div className="mb-3">
              <label htmlFor="nombreUsuario" className="form-label">
                Usuario
              </label>
              <input
                id="nombreUsuario"
                className="form-control"
                autoComplete="username"
                autoFocus
                value={nombreUsuario}
                onChange={(evento) => setNombreUsuario(evento.target.value)}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="contrasena" className="form-label">
                Contraseña
              </label>
              <div className="input-group">
                <input
                  id="contrasena"
                  className="form-control"
                  type={mostrarContrasena ? "text" : "password"}
                  autoComplete="current-password"
                  value={contrasena}
                  onChange={(evento) => setContrasena(evento.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  aria-label={mostrarContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
                  onClick={() => setMostrarContrasena(!mostrarContrasena)}
                >
                  <i className={`bi ${mostrarContrasena ? "bi-eye-slash" : "bi-eye"}`} />
                </button>
              </div>
            </div>

            <button className="btn btn-success w-100" type="submit" disabled={ingresando}>
              {ingresando && <span className="spinner-border spinner-border-sm me-2" />}
              {ingresando ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}