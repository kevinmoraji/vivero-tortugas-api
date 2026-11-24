import { Link } from "react-router-dom";

export default function NoEncontrada() {
  return (
    <div className="text-center my-5">
      <h2>Página no encontrada</h2>
      <p className="text-muted">La pantalla que busca no existe.</p>
      <Link to="/" className="btn btn-success">
        Ir al inicio
      </Link>
    </div>
  );
}