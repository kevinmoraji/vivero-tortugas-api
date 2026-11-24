export default function Tabla({ columnas, filas, acciones, textoVacio = "No hay registros." }) {
  if (filas.length === 0) {
    return <p className="text-muted text-center my-4">{textoVacio}</p>;
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle">
        <thead className="table-light">
          <tr>
            {columnas.map((columna) => (
              <th key={columna.titulo}>{columna.titulo}</th>
            ))}
            {acciones && <th className="text-end">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={fila.id}>
              {columnas.map((columna) => (
                <td key={columna.titulo}>{columna.mostrar(fila)}</td>
              ))}
              {acciones && <td className="text-end text-nowrap">{acciones(fila)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}