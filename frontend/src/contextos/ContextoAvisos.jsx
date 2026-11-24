import { createContext, useContext, useState } from "react";

const SEGUNDOS_VISIBLE = 4;

const ContextoAvisos = createContext(null);

export function ProveedorAvisos({ children }) {
  const [avisos, setAvisos] = useState([]);

  const quitarAviso = (idDelAviso) => {
    setAvisos((avisosActuales) => avisosActuales.filter((aviso) => aviso.id !== idDelAviso));
  };

  const agregarAviso = (texto, tipo) => {
    const idDelAviso = Date.now() + Math.random();
    setAvisos((avisosActuales) => [...avisosActuales, { id: idDelAviso, texto, tipo }]);
    setTimeout(() => quitarAviso(idDelAviso), SEGUNDOS_VISIBLE * 1000);
  };

  const valorDelContexto = {
    mostrarExito: (texto) => agregarAviso(texto, "success"),
    mostrarError: (texto) => agregarAviso(texto, "danger"),
  };

  return (
    <ContextoAvisos.Provider value={valorDelContexto}>
      {children}

      <div className="toast-container position-fixed bottom-0 end-0 p-3">
        {avisos.map((aviso) => (
          <div key={aviso.id} className={`toast show align-items-center text-bg-${aviso.tipo} border-0`} role="alert">
            <div className="d-flex">
              <div className="toast-body">
                <i className={`bi ${aviso.tipo === "success" ? "bi-check-circle" : "bi-exclamation-triangle"} me-2`} />
                {aviso.texto}
              </div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                aria-label="Cerrar"
                onClick={() => quitarAviso(aviso.id)}
              />
            </div>
          </div>
        ))}
      </div>
    </ContextoAvisos.Provider>
  );
}

export function useAvisos() {
  return useContext(ContextoAvisos);
}