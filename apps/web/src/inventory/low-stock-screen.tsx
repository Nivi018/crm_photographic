import { useEffect, useState, type ReactElement } from 'react';
import { DataState, DataTable, Pagination } from '../components/controls';
import { inventoryApi, type ArticleRecord } from './api-client';

export function LowStockScreen(): ReactElement {
  const [items, setItems] = useState<ArticleRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    setIsLoading(true);
    void inventoryApi
      .listLowStock(page)
      .then((result) => {
        setItems(result.items);
        setTotalPages(Math.max(result.totalPages, 1));
      })
      .catch(() => setError('No se pudieron cargar las alertas de stock bajo.'))
      .finally(() => setIsLoading(false));
  }, [page]);
  return (
    <main className="article-list">
      <header className="article-list__header">
        <div>
          <h1>Stock bajo</h1>
          <p>Articulos activos que requieren reposicion.</p>
        </div>
      </header>
      {isLoading ? <DataState title="Cargando alertas">Revisando existencias...</DataState> : null}
      {error ? <DataState title="No se pudieron cargar las alertas">{error}</DataState> : null}
      {!isLoading && !error && !items.length ? (
        <DataState title="Sin alertas">
          Todos los articulos activos superan su stock minimo.
        </DataState>
      ) : null}
      {items.length ? (
        <section className="article-results">
          <DataTable headers={['Articulo', 'Existencia actual', 'Stock minimo']}>
            {items.map(({ entity }) => (
              <tr key={entity.id}>
                <td>
                  <strong>{entity.name}</strong>
                </td>
                <td className="stock-low">{entity.currentStock}</td>
                <td>{entity.minimumStock}</td>
              </tr>
            ))}
          </DataTable>
          <Pagination onPageChange={setPage} page={page} totalPages={totalPages} />
        </section>
      ) : null}
    </main>
  );
}
