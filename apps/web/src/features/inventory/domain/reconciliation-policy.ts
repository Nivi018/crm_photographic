import type {
  ArticleMutationInput,
  ArticleSnapshot,
  CategorySnapshot,
  UpdateArticleMutationInput,
  UpdateCategoryMutationInput,
} from './inventory.types';

export type ReconciliationOutcome = 'applied' | 'not-applied' | 'indeterminate';

export interface ReconciliationDecision {
  currentData?: string;
  outcome: ReconciliationOutcome;
}

export type ArticleMutation =
  | { input: ArticleMutationInput; kind: 'create' }
  | { id: string; input: UpdateArticleMutationInput; kind: 'update' }
  | { expectedVersion: number; id: string; isActive: boolean; kind: 'state' }
  | { expectedVersion: number; id: string; kind: 'delete' };

export type CategoryMutation =
  | { kind: 'create'; name: string }
  | { id: string; input: UpdateCategoryMutationInput; kind: 'update' }
  | { expectedVersion: number; id: string; isActive: boolean; kind: 'state' }
  | { expectedVersion: number; id: string; kind: 'delete' };

export function decideArticleMutation(
  mutation: ArticleMutation,
  article: ArticleSnapshot | undefined,
): ReconciliationDecision {
  if (mutation.kind === 'create') {
    return article &&
      article.name === mutation.input.name &&
      article.categoryId === mutation.input.categoryId &&
      article.type === mutation.input.type
      ? applied(articleSummary(article))
      : notApplied();
  }

  if (mutation.kind === 'delete') {
    if (!article) return applied();
    return article.version === mutation.expectedVersion
      ? notApplied(articleSummary(article))
      : indeterminate(articleSummary(article));
  }
  if (!article) return indeterminate();

  const expectedVersion =
    mutation.kind === 'update' ? mutation.input.expectedVersion : mutation.expectedVersion;
  const isApplied =
    mutation.kind === 'update'
      ? article.version > mutation.input.expectedVersion &&
        article.name === mutation.input.name &&
        article.categoryId === mutation.input.categoryId &&
        article.type === mutation.input.type &&
        article.initialStock === mutation.input.initialStock &&
        article.minimumStock === mutation.input.minimumStock
      : article.version > mutation.expectedVersion && article.isActive === mutation.isActive;

  return isApplied
    ? applied(articleSummary(article))
    : article.version === expectedVersion
      ? notApplied(articleSummary(article))
      : indeterminate(articleSummary(article));
}

export function decideCategoryMutation(
  mutation: CategoryMutation,
  category: CategorySnapshot | undefined,
): ReconciliationDecision {
  if (mutation.kind === 'create') {
    return category ? applied(categorySummary(category)) : notApplied();
  }
  if (mutation.kind === 'delete') {
    if (!category) return applied();
    return category.version === mutation.expectedVersion
      ? notApplied(categorySummary(category))
      : indeterminate(categorySummary(category));
  }
  if (!category) return indeterminate();

  const expectedVersion =
    mutation.kind === 'update' ? mutation.input.expectedVersion : mutation.expectedVersion;
  const isApplied =
    mutation.kind === 'update'
      ? category.version > mutation.input.expectedVersion && category.name === mutation.input.name
      : category.version > mutation.expectedVersion && category.isActive === mutation.isActive;

  return isApplied
    ? applied(categorySummary(category))
    : category.version === expectedVersion
      ? notApplied(categorySummary(category))
      : indeterminate(categorySummary(category));
}

export function decideMovementMutation(
  mutation: { currentStock: number; expectedVersion: number; movementFound: boolean },
  article: Pick<ArticleSnapshot, 'currentStock' | 'name' | 'version'>,
): ReconciliationDecision {
  const currentData = articleSummary(article);
  if (mutation.movementFound && article.version > mutation.expectedVersion) {
    return applied(currentData);
  }
  return article.version === mutation.expectedVersion &&
    article.currentStock === mutation.currentStock
    ? notApplied(currentData)
    : indeterminate(currentData);
}

function applied(currentData?: string): ReconciliationDecision {
  return currentData ? { currentData, outcome: 'applied' } : { outcome: 'applied' };
}

function notApplied(currentData?: string): ReconciliationDecision {
  return currentData ? { currentData, outcome: 'not-applied' } : { outcome: 'not-applied' };
}

function indeterminate(currentData?: string): ReconciliationDecision {
  return currentData ? { currentData, outcome: 'indeterminate' } : { outcome: 'indeterminate' };
}

function articleSummary(
  article: Pick<ArticleSnapshot, 'currentStock' | 'name' | 'version'>,
): string {
  return `${article.name}; stock ${article.currentStock}; version ${article.version}.`;
}

function categorySummary(category: CategorySnapshot): string {
  return `${category.name}; ${category.isActive ? 'activa' : 'inactiva'}; version ${category.version}.`;
}
