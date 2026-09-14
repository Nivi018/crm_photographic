import type { ReactElement } from 'react';
import { DataState, DataTable, Pagination } from '../components/controls';
import {
  type LowStockClient,
  useLowStock,
} from '../features/inventory/application/hooks/use-low-stock';

export function LowStockScreen({ client }: { client?: LowStockClient }): ReactElement {
  const stock = useLowStock(client);
  const items = stock.result?.data ?? [];
  return (
    <main className="article-list">
      <header className="article-list__header">
        <div>
          <h1>Stock bajo</h1>
          <p>Articulos activos que requieren reposicion.</p>
        </div>
      </header>
      {stock.isLoading ? (
        <DataState title="Cargando alertas">Revisando existencias...</DataState>
      ) : null}
      {stock.error ? (
        <DataState title="No se pudieron cargar las alertas">
          {stock.error}
          <button onClick={() => void stock.reload()} type="button">
            Reintentar
          </button>
        </DataState>
      ) : null}
      {!stock.isLoading && !stock.error && !items.length ? (
        <DataState title="Sin alertas">
          Todos los articulos activos superan su stock minimo.
        </DataState>
      ) : null}
      {items.length ? (
        <section className="article-results">
          <DataTable headers={['Articulo', 'Existencia actual', 'Stock minimo']}>
            {items.map((article) => (
              <tr key={article.id}>
                <td>
                  <strong>{article.name}</strong>
                </td>
                <td className="stock-low">{article.currentStock}</td>
                <td>{article.minimumStock}</td>
              </tr>
            ))}
          </DataTable>
          <Pagination
            onPageChange={stock.setPage}
            page={stock.page}
            totalPages={stock.totalPages}
          />
        </section>
      ) : null}
    </main>
  );
}
