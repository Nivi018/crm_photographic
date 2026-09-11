import { type ApiPaginatedResponse } from '@crm-photografy/shared';
import {
  type ArticleInput,
  type ArticleRecord,
  type CategoryRecord,
  InventoryApiError,
  type MovementRecord,
  type UpdateArticleInput,
  type UpdateCategoryInput,
} from './api-client';
import type { ReconciliationDecision } from './use-mutation-reconciliation';

export type ArticleMutation =
  | { input: ArticleInput; kind: 'create' }
  | { id: string; input: UpdateArticleInput; kind: 'update' }
  | { expectedVersion: number; id: string; isActive: boolean; kind: 'state' }
  | { expectedVersion: number; id: string; kind: 'delete' };

export type CategoryMutation =
  | { kind: 'create'; name: string }
  | { id: string; input: UpdateCategoryInput; kind: 'update' }
  | { expectedVersion: number; id: string; isActive: boolean; kind: 'state' }
  | { expectedVersion: number; id: string; kind: 'delete' };

export interface MovementMutation {
  articleId: string;
  currentStock: number;
  expectedVersion: number;
  kind: 'entry' | 'exit' | 'final' | 'delta';
  quantity: number;
  reason: string;
}

export async function reconcileArticleMutation(
  mutation: ArticleMutation,
  client: {
    findArticle(id: string): Promise<{ data: ArticleRecord }>;
    listArticles(query: {
      name?: string;
      page: number;
    }): Promise<ApiPaginatedResponse<ArticleRecord>>;
  },
): Promise<ReconciliationDecision> {
  if (mutation.kind === 'create') {
    const articles = await client.listArticles({ name: mutation.input.name, page: 1 });
    const article = articles.data.find(
      (item) =>
        item.name === mutation.input.name &&
        item.categoryId === mutation.input.categoryId &&
        item.type === mutation.input.type,
    );
    return article
      ? { currentData: articleSummary(article), outcome: 'applied' }
      : { outcome: 'not-applied' };
  }

  try {
    const article = (await client.findArticle(mutation.id)).data;
    if (mutation.kind === 'delete') {
      return article.version === mutation.expectedVersion
        ? { currentData: articleSummary(article), outcome: 'not-applied' }
        : { currentData: articleSummary(article), outcome: 'indeterminate' };
    }

    const isApplied =
      mutation.kind === 'update'
        ? article.version > mutation.input.expectedVersion &&
          article.name === mutation.input.name &&
          article.categoryId === mutation.input.categoryId &&
          article.type === mutation.input.type &&
          article.initialStock === mutation.input.initialStock &&
          article.minimumStock === mutation.input.minimumStock
        : article.version > mutation.expectedVersion && article.isActive === mutation.isActive;
    const expectedVersion =
      mutation.kind === 'update' ? mutation.input.expectedVersion : mutation.expectedVersion;

    return {
      currentData: articleSummary(article),
      outcome: isApplied
        ? 'applied'
        : article.version === expectedVersion
          ? 'not-applied'
          : 'indeterminate',
    };
  } catch (error) {
    if (
      mutation.kind === 'delete' &&
      error instanceof InventoryApiError &&
      error.statusCode === 404
    ) {
      return { outcome: 'applied' };
    }
    throw error;
  }
}

export async function reconcileCategoryMutation(
  mutation: CategoryMutation,
  client: {
    listCategories(query: { page: number }): Promise<ApiPaginatedResponse<CategoryRecord>>;
  },
): Promise<ReconciliationDecision> {
  const categories = await loadAllCategories(client);
  const category =
    mutation.kind === 'create'
      ? categories.find((item) => item.name === mutation.name)
      : categories.find((item) => item.id === mutation.id);

  if (mutation.kind === 'create') {
    return category
      ? { currentData: categorySummary(category), outcome: 'applied' }
      : { outcome: 'not-applied' };
  }
  if (mutation.kind === 'delete') {
    return category
      ? category.version === mutation.expectedVersion
        ? { currentData: categorySummary(category), outcome: 'not-applied' }
        : { currentData: categorySummary(category), outcome: 'indeterminate' }
      : { outcome: 'applied' };
  }
  if (!category) return { outcome: 'indeterminate' };

  const isApplied =
    mutation.kind === 'update'
      ? category.version > mutation.input.expectedVersion && category.name === mutation.input.name
      : category.version > mutation.expectedVersion && category.isActive === mutation.isActive;
  const expectedVersion =
    mutation.kind === 'update' ? mutation.input.expectedVersion : mutation.expectedVersion;
  return {
    currentData: categorySummary(category),
    outcome: isApplied
      ? 'applied'
      : category.version === expectedVersion
        ? 'not-applied'
        : 'indeterminate',
  };
}

export async function reconcileMovementMutation(
  mutation: MovementMutation,
  client: {
    findArticle(id: string): Promise<{ data: ArticleRecord }>;
    listArticleMovements(id: string, page: number): Promise<ApiPaginatedResponse<MovementRecord>>;
  },
): Promise<ReconciliationDecision> {
  const [articleResult, movements] = await Promise.all([
    client.findArticle(mutation.articleId),
    client.listArticleMovements(mutation.articleId, 1),
  ]);
  const article = articleResult.data;
  const expectedStock = movementStockAfter(mutation);
  const foundMovement = movements.data.some(
    (movement) =>
      movement.stockBefore === mutation.currentStock &&
      movement.stockAfter === expectedStock &&
      movement.kind ===
        (mutation.kind === 'entry' ? 'ENTRY' : mutation.kind === 'exit' ? 'EXIT' : 'ADJUSTMENT') &&
      (mutation.kind === 'final' || movement.reason === mutation.reason),
  );

  return {
    currentData: articleSummary(article),
    outcome:
      foundMovement && article.version > mutation.expectedVersion
        ? 'applied'
        : article.version === mutation.expectedVersion &&
            article.currentStock === mutation.currentStock
          ? 'not-applied'
          : 'indeterminate',
  };
}

async function loadAllCategories(client: {
  listCategories(query: { page: number }): Promise<ApiPaginatedResponse<CategoryRecord>>;
}): Promise<CategoryRecord[]> {
  const firstPage = await client.listCategories({ page: 1 });
  const categories = [...firstPage.data];
  for (let page = 2; page <= firstPage.meta.totalPages; page += 1) {
    categories.push(...(await client.listCategories({ page })).data);
  }
  return categories;
}

function movementStockAfter(mutation: MovementMutation): number {
  if (mutation.kind === 'final') return mutation.quantity;
  if (mutation.kind === 'exit') return mutation.currentStock - mutation.quantity;
  return mutation.currentStock + mutation.quantity;
}

function articleSummary(article: ArticleRecord): string {
  return `${article.name}; stock ${article.currentStock}; version ${article.version}.`;
}

function categorySummary(category: CategoryRecord): string {
  return `${category.name}; ${category.isActive ? 'activa' : 'inactiva'}; version ${category.version}.`;
}
