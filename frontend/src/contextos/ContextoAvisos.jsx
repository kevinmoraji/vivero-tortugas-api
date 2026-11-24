import { createContext, useContext } from "react";

const ContextoAvisos = createContext(null);

export function ProveedorAvisos({ children }) {
  const valorDelContexto = {
    mostrarExito: (texto) => window.alert(texto),
    mostrarError: (texto) => window.alert(`Error: ${texto}`),
  };

  return <ContextoAvisos.Provider value={valorDelContexto}>{children}</ContextoAvisos.Provider>;
}

export function useAvisos() {
  return useContext(ContextoAvisos);
}