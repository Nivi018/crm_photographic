import type { ReactElement } from 'react';
import { DataState, DataTable, Pagination } from '../components/controls';
import { useMovementList } from './use-movement-list';

export function MovementListScreen(): ReactElement {
  const { error, isLoading, page, result, setPage } = useMovementList();
  return (
    <main className="article-list">
      <header className="article-list__header">
        <div>
          <h1>Movimientos</h1>
          <p>Historial inmutable de entradas, salidas y ajustes.</p>
        </div>
      </header>
      {isLoading ? (
        <DataState title="Cargando movimientos">Consultando historial...</DataState>
      ) : null}
      {error ? <DataState title="No se pudo cargar el historial">{error}</DataState> : null}
      {!isLoading && !error && result?.data.length === 0 ? (
        <DataState title="Sin movimientos">Aun no hay movimientos registrados.</DataState>
      ) : null}
      {result?.data.length ? (
        <section className="article-results">
          <DataTable
            headers={[
              'Articulo',
              'Tipo',
              'Cantidad',
              'Motivo',
              'Fecha',
              'Stock anterior',
              'Stock posterior',
            ]}
          >
            {result.data.map((movement) => (
              <tr key={movement.id}>
                <td>{movement.articleId}</td>
                <td>
                  {movement.kind}
                  {movement.adjustmentMode ? ` (${movement.adjustmentMode})` : ''}
                </td>
                <td>
                  {movement.appliedQuantity > 0
                    ? `+${movement.appliedQuantity}`
                    : movement.appliedQuantity}
                </td>
                <td>{movement.reason}</td>
                <td>
                  {new Intl.DateTimeFormat('es-MX', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(new Date(movement.occurredAt))}
                </td>
                <td>{movement.stockBefore}</td>
                <td>{movement.stockAfter}</td>
              </tr>
            ))}
          </DataTable>
          <Pagination
            onPageChange={setPage}
            page={page}
            totalPages={Math.max(result.meta.totalPages, 1)}
          />
        </section>
      ) : null}
    </main>
  );
}
