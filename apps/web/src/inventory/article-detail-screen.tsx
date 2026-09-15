import { type ReactElement } from 'react';
import { DataState, DataTable, Pagination } from '../shared/presentation/controls';
import {
  type ArticleDetailClient,
  useArticleDetail,
} from '../features/inventory/application/hooks/use-article-detail';
import { MutationReconciliationNotice } from './mutation-reconciliation-notice';

export function ArticleDetailScreen({
  articleClient,
  articleId,
}: {
  articleClient?: ArticleDetailClient;
  articleId: string;
}): ReactElement {
  const detail = useArticleDetail(articleId, articleClient);

  if (detail.isArticleLoading)
    return <DataState title="Cargando articulo">Preparando el detalle...</DataState>;
  if (detail.articleError || !detail.article)
    return (
      <DataState title="No se pudo cargar el articulo">
        {detail.articleError}
        <button onClick={() => void detail.reloadArticle()} type="button">
          Reintentar
        </button>
      </DataState>
    );

  const article = detail.article;
  return (
    <main className="article-detail">
      <header>
        <h1>{article.name}</h1>
        <p>
          Stock actual: <strong>{article.currentStock}</strong>
        </p>
        <div className="article-actions">
          <button
            disabled={detail.isSubmitting || detail.reconciliation.isMutationBlocked}
            onClick={() => void detail.toggleArticleState(article)}
            type="button"
          >
            {article.isActive ? 'Desactivar articulo' : 'Reactivar articulo'}
          </button>
          <button
            disabled={detail.isSubmitting || detail.reconciliation.isMutationBlocked}
            onClick={() => {
              if (window.confirm('Eliminar este articulo de forma permanente?'))
                void detail.deleteArticle(article);
            }}
            type="button"
          >
            Eliminar articulo
          </button>
        </div>
      </header>
      {detail.actionError ? (
        <DataState title="No se pudo completar la accion">{detail.actionError}</DataState>
      ) : null}
      <MutationReconciliationNotice
        currentData={detail.reconciliation.currentData}
        onConfirmManualRetry={detail.reconciliation.confirmManualRetry}
        onRetryMutation={() => void detail.reconciliation.retryMutation()}
        onRetryReconciliation={() => void detail.reconciliation.retryReconciliation()}
        phase={detail.reconciliation.phase}
      />
      {detail.isHistoryLoading ? (
        <DataState title="Cargando historial">Consultando movimientos...</DataState>
      ) : null}
      {detail.historyError ? (
        <DataState title="No se pudo cargar el historial">
          {detail.historyError}
          <button onClick={() => void detail.reloadHistory()} type="button">
            Reintentar
          </button>
        </DataState>
      ) : null}
      {!detail.isHistoryLoading && !detail.historyError && !detail.history.length ? (
        <DataState title="Sin movimientos">
          Este articulo aun no tiene movimientos registrados.
        </DataState>
      ) : null}
      {!detail.isHistoryLoading && !detail.historyError && detail.history.length ? (
        <section className="article-results">
          <DataTable
            headers={['Tipo', 'Cantidad', 'Motivo', 'Fecha', 'Stock anterior', 'Stock posterior']}
          >
            {detail.history.map((movement) => (
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
          <Pagination
            onPageChange={detail.setPage}
            page={detail.page}
            totalPages={detail.totalPages}
          />
        </section>
      ) : null}
    </main>
  );
}
