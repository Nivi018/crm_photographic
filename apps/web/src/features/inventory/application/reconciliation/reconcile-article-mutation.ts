import type { InventoryApiPort } from '../ports/inventory-api.port';
import {
  decideArticleMutation,
  type ArticleMutation,
  type ReconciliationDecision,
} from '../../domain/reconciliation-policy';

export async function reconcileArticleMutation(
  mutation: ArticleMutation,
  inventoryApi: Pick<InventoryApiPort, 'findArticle' | 'listArticles'>,
): Promise<ReconciliationDecision> {
  if (mutation.kind === 'create') {
    const articles = await inventoryApi.listArticles({ name: mutation.input.name, page: 1 });
    const article = articles.data.find(
      (item) =>
        item.name === mutation.input.name &&
        item.categoryId === mutation.input.categoryId &&
        item.type === mutation.input.type,
    );
    return decideArticleMutation(mutation, article);
  }

  try {
    return decideArticleMutation(mutation, (await inventoryApi.findArticle(mutation.id)).data);
  } catch (cause) {
    if (mutation.kind === 'delete' && hasStatusCode(cause, 404)) {
      return decideArticleMutation(mutation, undefined);
    }
    throw cause;
  }
}

function hasStatusCode(cause: unknown, statusCode: number): boolean {
  return (
    typeof cause === 'object' &&
    cause !== null &&
    'statusCode' in cause &&
    cause.statusCode === statusCode
  );
}
