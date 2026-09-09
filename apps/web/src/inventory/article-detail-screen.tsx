import { useEffect, useEffectEvent, useState, type ReactElement } from 'react';
import { DataState, DataTable, Pagination } from '../components/controls';
import { inventoryApi, type MovementRecord } from './api-client';
import { useArticleRecord, type ArticleRecordClient } from './use-article-record';

export interface ArticleMovementClient {
  listArticleMovements(
    id: string,
    page: number,
  ): Promise<{ items: MovementRecord[]; totalPages: number }>;
}

export function ArticleDetailScreen({
  articleClient,
  articleId,
  movementClient,
}: {
  articleClient?: ArticleRecordClient | undefined;
  articleId: string;
  movementClient?: ArticleMovementClient | undefined;
}): ReactElement {
  const {
    article,
    error: articleError,
    isLoading: isArticleLoading,
  } = useArticleRecord(articleId, articleClient);
  const [items, setItems] = useState<MovementRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const loadMovements = useEffectEvent(async () => {
    try {
      const result = await (movementClient ?? inventoryApi).listArticleMovements(articleId, page);
      setItems(result.items);
      setTotalPages(Math.max(result.totalPages, 1));
    } catch {
      setError('No se pudo cargar el historial del articulo.');
    } finally {
      setIsLoading(false);
    }
  });
  useEffect(() => {
    void loadMovements();
  }, [articleId, page]);

  if (isArticleLoading)
    return <DataState title="Cargando articulo">Preparando el detalle...</DataState>;
  if (articleError || !article)
    return <DataState title="No se pudo cargar el articulo">{articleError}</DataState>;
  return (
    <main className="article-detail">
      <header>
        <h1>{article.entity.name}</h1>
        <p>
          Stock actual: <strong>{article.entity.currentStock}</strong>
        </p>
      </header>
      {isLoading ? (
        <DataState title="Cargando historial">Consultando movimientos...</DataState>
      ) : null}
      {error ? <DataState title="No se pudo cargar el historial">{error}</DataState> : null}
      {!isLoading && !error && !items.length ? (
        <DataState title="Sin movimientos">
          Este articulo aun no tiene movimientos registrados.
        </DataState>
      ) : null}
      {!isLoading && !error && items.length ? (
        <section className="article-results">
          <DataTable
            headers={['Tipo', 'Cantidad', 'Motivo', 'Fecha', 'Stock anterior', 'Stock posterior']}
          >
            {items.map((movement) => (
              <tr key={movement.id}>
                <td>{movement.kind}</td>
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
          <Pagination onPageChange={setPage} page={page} totalPages={totalPages} />
        </section>
      ) : null}
    </main>
  );
}
