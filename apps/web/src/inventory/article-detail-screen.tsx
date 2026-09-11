import { useEffect, useEffectEvent, useState, type ReactElement } from 'react';
import { type ApiPaginatedResponse } from '@crm-photografy/shared';
import { DataState, DataTable, Pagination } from '../components/controls';
import { inventoryApi, type MovementRecord } from './api-client';
import { MutationReconciliationNotice } from './mutation-reconciliation-notice';
import { type ArticleMutation, reconcileArticleMutation } from './reconcile-inventory-mutation';
import { useArticleRecord, type ArticleRecordClient } from './use-article-record';
import { useMutationReconciliation } from './use-mutation-reconciliation';

export interface ArticleMovementClient {
  listArticleMovements(id: string, page: number): Promise<ApiPaginatedResponse<MovementRecord>>;
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
    reload,
  } = useArticleRecord(articleId, articleClient);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const reconciliation = useMutationReconciliation();
  async function updateState(action: () => Promise<unknown>, mutation: ArticleMutation) {
    if (reconciliation.isMutationBlocked) return;
    setActionError(null);
    setIsSubmitting(true);
    try {
      const result = await reconciliation.execute(action, async () => {
        const decision = await reconcileArticleMutation(mutation, inventoryApi);
        await reload();
        return decision;
      });
      if (result) await reload();
    } catch {
      setActionError('No se pudo completar la accion. Verifica el estado actual del articulo.');
    } finally {
      setIsSubmitting(false);
    }
  }
  const [items, setItems] = useState<MovementRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const loadMovements = useEffectEvent(async () => {
    try {
      const result = await (movementClient ?? inventoryApi).listArticleMovements(articleId, page);
      setItems(result.data);
      setTotalPages(Math.max(result.meta.totalPages, 1));
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
        <h1>{article.name}</h1>
        <p>
          Stock actual: <strong>{article.currentStock}</strong>
        </p>
        <div className="article-actions">
          <button
            disabled={isSubmitting || reconciliation.isMutationBlocked}
            onClick={() =>
              void updateState(
                () =>
                  article.isActive
                    ? inventoryApi.deactivateArticle(articleId, article.version)
                    : inventoryApi.reactivateArticle(articleId, article.version),
                {
                  expectedVersion: article.version,
                  id: articleId,
                  isActive: !article.isActive,
                  kind: 'state',
                },
              )
            }
            type="button"
          >
            {article.isActive ? 'Desactivar articulo' : 'Reactivar articulo'}
          </button>
          <button
            disabled={isSubmitting || reconciliation.isMutationBlocked}
            onClick={() => {
              if (window.confirm('Eliminar este articulo de forma permanente?'))
                void updateState(() => inventoryApi.deleteArticle(articleId, article.version), {
                  expectedVersion: article.version,
                  id: articleId,
                  kind: 'delete',
                });
            }}
            type="button"
          >
            Eliminar articulo
          </button>
        </div>
      </header>
      {actionError ? (
        <DataState title="No se pudo completar la accion">{actionError}</DataState>
      ) : null}
      <MutationReconciliationNotice
        currentData={reconciliation.currentData}
        onConfirmManualRetry={reconciliation.confirmManualRetry}
        onRetryMutation={() => void reconciliation.retryMutation()}
        onRetryReconciliation={() => void reconciliation.retryReconciliation()}
        phase={reconciliation.phase}
      />
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
