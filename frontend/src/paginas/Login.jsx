import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useSesion } from "../contextos/ContextoSesion";
import { textoDelError } from "../api/errores";

export default function Login() {
  const { iniciarSesion } = useSesion();
  const navegar = useNavigate();
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mensajeDeError, setMensajeDeError] = useState("");

  const manejarIngreso = async (evento) => {
    evento.preventDefault();
    setMensajeDeError("");
    try {
      await iniciarSesion(nombreUsuario, contrasena);
      navegar("/", { replace: true });
    } catch (errorDeLogin) {
      setMensajeDeError(textoDelError(errorDeLogin));
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: 400 }}>
      <h1 className="h4 mb-4 text-center">Vivero de Tortugas</h1>
      <form onSubmit={manejarIngreso}>
        <input
          className="form-control mb-2"
          placeholder="Usuario"
          value={nombreUsuario}
          onChange={(evento) => setNombreUsuario(evento.target.value)}
        />
        <input
          className="form-control mb-2"
          type="password"
          placeholder="Contraseña"
          value={contrasena}
          onChange={(evento) => setContrasena(evento.target.value)}
        />
        {mensajeDeError && <div className="alert alert-danger py-2">{mensajeDeError}</div>}
        <button className="btn btn-success w-100" type="submit">
          Entrar
        </button>
      </form>
    </div>
  );
}