import { useCallback, useEffect, useState } from "react";

import { textoDelError } from "../api/errores";

export function useListadoPaginado(servicio, filtrosIniciales = {}) {
  const [registros, setRegistros] = useState([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const recargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const respuesta = await servicio.listar({ ...filtros, page: pagina });
      setRegistros(respuesta.results);
      setTotalRegistros(respuesta.count);
    } catch (errorDeCarga) {
      setError(textoDelError(errorDeCarga));
    } finally {
      setCargando(false);
    }
  }, [servicio, filtros, pagina]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  const cambiarFiltro = (nombreDelFiltro, valor) => {
    setFiltros((filtrosAnteriores) => ({ ...filtrosAnteriores, [nombreDelFiltro]: valor }));
    setPagina(1);
  };

  return {
    registros,
    totalRegistros,
    pagina,
    setPagina,
    filtros,
    cambiarFiltro,
    cargando,
    error,
    recargar,
  };
}