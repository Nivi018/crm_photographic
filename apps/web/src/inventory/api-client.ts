import { ArticleType, type PaginatedResponse } from '@crm-photografy/shared';

export interface ArticleListQuery {
  categoryId?: string;
  isActive?: boolean;
  name?: string;
  page?: number;
  type?: ArticleType;
}

export interface CategoryListQuery {
  isActive?: boolean;
  page?: number;
}

export interface CategoryRecord {
  entity: { id: string; isActive: boolean; name: string };
  version: number;
}

export interface UpdateCategoryInput {
  expectedVersion: number;
  name: string;
}

export interface ArticleRecord {
  entity: {
    categoryId: string;
    currentStock: number;
    id: string;
    initialStock: number;
    isActive: boolean;
    minimumStock: number;
    name: string;
    type: string;
  };
  version: number;
}

export interface ArticleInput {
  categoryId: string;
  initialStock: number;
  minimumStock: number;
  name: string;
  type: ArticleType;
}

export interface UpdateArticleInput extends ArticleInput {
  expectedVersion: number;
}

export class InventoryApiError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}

export interface MovementRecord {
  adjustmentMode: string | null;
  appliedQuantity: number;
  articleId: string;
  id: string;
  kind: string;
  occurredAt: string;
  reason: string;
  sequence: string;
  stockAfter: number;
  stockBefore: number;
}
export interface MovementInput {
  confirmNegativeStock?: boolean;
  expectedVersion: number;
  quantity: number;
  reason: string;
}
export interface FinalStockAdjustmentInput {
  expectedVersion: number;
  finalStock: number;
}

export class InventoryApiClient {
  constructor(
    private readonly fetcher: typeof fetch = fetch,
    private readonly baseUrl = '/api/inventory',
  ) {}

  listArticles(query: ArticleListQuery = {}): Promise<PaginatedResponse<ArticleRecord>> {
    const parameters = new URLSearchParams({ page: String(query.page ?? 1) });

    if (query.name) parameters.set('name', query.name);
    if (query.type) parameters.set('type', query.type);
    if (query.categoryId) parameters.set('categoryId', query.categoryId);
    if (query.isActive !== undefined) parameters.set('isActive', String(query.isActive));

    return this.get(`/articles?${parameters}`);
  }
  listLowStock(page = 1): Promise<PaginatedResponse<ArticleRecord>> {
    return this.get(`/articles/low-stock?page=${page}`);
  }

  createArticle(input: ArticleInput): Promise<ArticleRecord> {
    return this.post('/articles', input);
  }

  updateArticle(id: string, input: UpdateArticleInput): Promise<ArticleRecord> {
    return this.send(`/articles/${id}`, { body: JSON.stringify(input), method: 'PATCH' });
  }

  deactivateArticle(id: string, expectedVersion: number): Promise<ArticleRecord> {
    return this.post(`/articles/${id}/deactivate`, { expectedVersion });
  }

  reactivateArticle(id: string, expectedVersion: number): Promise<ArticleRecord> {
    return this.post(`/articles/${id}/reactivate`, { expectedVersion });
  }

  deleteArticle(id: string, expectedVersion: number): Promise<void> {
    return this.send(`/articles/${id}`, {
      body: JSON.stringify({ expectedVersion }),
      method: 'DELETE',
    });
  }

  listCategories(query: CategoryListQuery = {}): Promise<PaginatedResponse<CategoryRecord>> {
    const parameters = new URLSearchParams({ page: String(query.page ?? 1) });
    if (query.isActive !== undefined) parameters.set('isActive', String(query.isActive));
    return this.get(`/categories?${parameters}`);
  }

  createCategory(name: string): Promise<CategoryRecord> {
    return this.post('/categories', { name });
  }
  updateCategory(id: string, input: UpdateCategoryInput): Promise<CategoryRecord> {
    return this.send(`/categories/${id}`, { body: JSON.stringify(input), method: 'PATCH' });
  }
  deactivateCategory(id: string, expectedVersion: number): Promise<CategoryRecord> {
    return this.post(`/categories/${id}/deactivate`, { expectedVersion });
  }
  reactivateCategory(id: string, expectedVersion: number): Promise<CategoryRecord> {
    return this.post(`/categories/${id}/reactivate`, { expectedVersion });
  }
  deleteCategory(id: string, expectedVersion: number): Promise<void> {
    return this.send(`/categories/${id}`, {
      body: JSON.stringify({ expectedVersion }),
      method: 'DELETE',
    });
  }

  findArticle(id: string): Promise<ArticleRecord> {
    return this.get(`/articles/${id}`);
  }

  listMovements(page = 1): Promise<PaginatedResponse<MovementRecord>> {
    return this.get(`/movements?page=${page}`);
  }

  listArticleMovements(id: string, page = 1): Promise<PaginatedResponse<MovementRecord>> {
    return this.get(`/articles/${id}/movements?page=${page}`);
  }
  createEntry(id: string, input: MovementInput): Promise<MovementRecord> {
    return this.post(`/articles/${id}/movements/entries`, input);
  }
  createExit(id: string, input: MovementInput): Promise<MovementRecord> {
    return this.post(`/articles/${id}/movements/exits`, input);
  }
  createFinalStockAdjustment(
    id: string,
    input: FinalStockAdjustmentInput,
  ): Promise<MovementRecord> {
    return this.post(`/articles/${id}/movements/final-stock-adjustments`, input);
  }
  createDeltaAdjustment(id: string, input: MovementInput): Promise<MovementRecord> {
    return this.post(`/articles/${id}/movements/delta-adjustments`, input);
  }

  private async get<T>(path: string): Promise<T> {
    return this.send(path);
  }

  private post<T>(path: string, body: unknown): Promise<T> {
    return this.send(path, { body: JSON.stringify(body), method: 'POST' });
  }

  private async send<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await this.fetcher(`${this.baseUrl}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        code?: unknown;
        message?: unknown;
      } | null;
      throw new InventoryApiError(
        typeof body?.message === 'string'
          ? body.message
          : `Inventory request failed with status ${response.status}`,
        typeof body?.code === 'string' ? body.code : undefined,
      );
    }

    return response.json() as Promise<T>;
  }
}

export const inventoryApi = new InventoryApiClient();
