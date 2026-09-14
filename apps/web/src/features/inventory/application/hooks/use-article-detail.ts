import type { ArticleResponse } from '@crm-photografy/shared';
import { useState } from 'react';
import { useOptionalInventoryApi } from '../inventory-api-context';
import type { InventoryApiPort } from '../ports/inventory-api.port';
import { reconcileArticleMutation } from '../reconciliation/reconcile-article-mutation';
import type { ArticleMutation } from '../../domain/reconciliation-policy';
import { useMutationReconciliation } from '../../../../inventory/use-mutation-reconciliation';
import { useInventoryQuery } from './use-inventory-query';

export type ArticleDetailClient = Pick<
  InventoryApiPort,
  | 'deactivateArticle'
  | 'deleteArticle'
  | 'findArticle'
  | 'listArticleMovements'
  | 'listArticles'
  | 'reactivateArticle'
>;

export function useArticleDetail(articleId: string, client?: ArticleDetailClient) {
  const injectedInventoryApi = useOptionalInventoryApi();
  const inventoryApi = client ?? injectedInventoryApi;
  if (!inventoryApi) throw new Error('El detalle de articulos requiere un puerto de inventario.');
  const articleApi = inventoryApi;
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const reconciliation = useMutationReconciliation();
  const articleQuery = useInventoryQuery({
    errorMessage: () => 'No se pudo cargar el articulo para editarlo.',
    query: () => articleApi.findArticle(articleId),
    queryKey: articleId,
  });
  const movementQuery = useInventoryQuery({
    errorMessage: () => 'No se pudo cargar el historial del articulo.',
    query: () => articleApi.listArticleMovements(articleId, page),
    queryKey: `${articleId}:${page}`,
  });

  async function updateState(
    action: () => Promise<unknown>,
    mutation: ArticleMutation,
  ): Promise<void> {
    if (reconciliation.isMutationBlocked) return;
    setActionError(null);
    setIsSubmitting(true);
    try {
      const result = await reconciliation.execute(action, async () => {
        const decision = await reconcileArticleMutation(mutation, articleApi);
        await articleQuery.reload();
        return decision;
      });
      if (result) await articleQuery.reload();
    } catch {
      setActionError('No se pudo completar la accion. Verifica el estado actual del articulo.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleArticleState(article: ArticleResponse): Promise<void> {
    await updateState(
      () =>
        article.isActive
          ? articleApi.deactivateArticle(article.id, article.version)
          : articleApi.reactivateArticle(article.id, article.version),
      {
        expectedVersion: article.version,
        id: article.id,
        isActive: !article.isActive,
        kind: 'state',
      },
    );
  }

  async function deleteArticle(article: ArticleResponse): Promise<void> {
    await updateState(() => articleApi.deleteArticle(article.id, article.version), {
      expectedVersion: article.version,
      id: article.id,
      kind: 'delete',
    });
  }

  return {
    actionError,
    article: articleQuery.result?.data ?? null,
    articleError: articleQuery.error,
    deleteArticle,
    history: movementQuery.result?.data ?? [],
    historyError: movementQuery.error,
    isArticleLoading: articleQuery.isLoading,
    isHistoryLoading: movementQuery.isLoading,
    isSubmitting,
    page,
    reconciliation,
    reloadArticle: articleQuery.reload,
    reloadHistory: movementQuery.reload,
    setPage,
    toggleArticleState,
    totalPages: Math.max(movementQuery.result?.meta.totalPages ?? 1, 1),
  };
}
