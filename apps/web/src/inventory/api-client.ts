import {
  ArticleType,
  type ApiErrorResponse,
  type ApiPaginatedResponse,
  type ApiResponse,
  type ArticleResponse,
  type CategoryResponse,
  type DeleteResponse,
  type MovementOperationResponse,
  type MovementResponse,
} from '@crm-photografy/shared';

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

export type CategoryRecord = CategoryResponse;

export interface UpdateCategoryInput {
  expectedVersion: number;
  name: string;
}

export type ArticleRecord = ArticleResponse;

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
    readonly code?: ApiErrorResponse['code'],
    readonly statusCode?: number,
    readonly details?: ApiErrorResponse['details'],
  ) {
    super(message);
  }
}

export type MovementRecord = MovementResponse;
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

  listArticles(query: ArticleListQuery = {}): Promise<ApiPaginatedResponse<ArticleRecord>> {
    const parameters = new URLSearchParams({ page: String(query.page ?? 1) });

    if (query.name) parameters.set('name', query.name);
    if (query.type) parameters.set('type', query.type);
    if (query.categoryId) parameters.set('categoryId', query.categoryId);
    if (query.isActive !== undefined) parameters.set('isActive', String(query.isActive));

    return this.get(`/articles?${parameters}`);
  }
  listLowStock(page = 1): Promise<ApiPaginatedResponse<ArticleRecord>> {
    return this.get(`/articles/low-stock?page=${page}`);
  }

  createArticle(input: ArticleInput): Promise<ApiResponse<ArticleRecord>> {
    return this.post('/articles', input);
  }

  updateArticle(id: string, input: UpdateArticleInput): Promise<ApiResponse<ArticleRecord>> {
    return this.send(`/articles/${id}`, { body: JSON.stringify(input), method: 'PATCH' });
  }

  deactivateArticle(id: string, expectedVersion: number): Promise<ApiResponse<ArticleRecord>> {
    return this.post(`/articles/${id}/deactivate`, { expectedVersion });
  }

  reactivateArticle(id: string, expectedVersion: number): Promise<ApiResponse<ArticleRecord>> {
    return this.post(`/articles/${id}/reactivate`, { expectedVersion });
  }

  deleteArticle(id: string, expectedVersion: number): Promise<ApiResponse<DeleteResponse>> {
    return this.send(`/articles/${id}`, {
      body: JSON.stringify({ expectedVersion }),
      method: 'DELETE',
    });
  }

  listCategories(query: CategoryListQuery = {}): Promise<ApiPaginatedResponse<CategoryRecord>> {
    const parameters = new URLSearchParams({ page: String(query.page ?? 1) });
    if (query.isActive !== undefined) parameters.set('isActive', String(query.isActive));
    return this.get(`/categories?${parameters}`);
  }

  createCategory(name: string): Promise<ApiResponse<CategoryRecord>> {
    return this.post('/categories', { name });
  }
  updateCategory(id: string, input: UpdateCategoryInput): Promise<ApiResponse<CategoryRecord>> {
    return this.send(`/categories/${id}`, { body: JSON.stringify(input), method: 'PATCH' });
  }
  deactivateCategory(id: string, expectedVersion: number): Promise<ApiResponse<CategoryRecord>> {
    return this.post(`/categories/${id}/deactivate`, { expectedVersion });
  }
  reactivateCategory(id: string, expectedVersion: number): Promise<ApiResponse<CategoryRecord>> {
    return this.post(`/categories/${id}/reactivate`, { expectedVersion });
  }
  deleteCategory(id: string, expectedVersion: number): Promise<ApiResponse<DeleteResponse>> {
    return this.send(`/categories/${id}`, {
      body: JSON.stringify({ expectedVersion }),
      method: 'DELETE',
    });
  }

  findArticle(id: string): Promise<ApiResponse<ArticleRecord>> {
    return this.get(`/articles/${id}`);
  }

  listMovements(page = 1): Promise<ApiPaginatedResponse<MovementRecord>> {
    return this.get(`/movements?page=${page}`);
  }

  listArticleMovements(id: string, page = 1): Promise<ApiPaginatedResponse<MovementRecord>> {
    return this.get(`/articles/${id}/movements?page=${page}`);
  }
  createEntry(id: string, input: MovementInput): Promise<ApiResponse<MovementOperationResponse>> {
    return this.post(`/articles/${id}/movements/entries`, input);
  }
  createExit(id: string, input: MovementInput): Promise<ApiResponse<MovementOperationResponse>> {
    return this.post(`/articles/${id}/movements/exits`, input);
  }
  createFinalStockAdjustment(
    id: string,
    input: FinalStockAdjustmentInput,
  ): Promise<ApiResponse<MovementOperationResponse>> {
    return this.post(`/articles/${id}/movements/final-stock-adjustments`, input);
  }
  createDeltaAdjustment(
    id: string,
    input: MovementInput,
  ): Promise<ApiResponse<MovementOperationResponse>> {
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
      const body = (await response.json().catch(() => null)) as Partial<ApiErrorResponse> | null;
      throw new InventoryApiError(
        typeof body?.message === 'string'
          ? body.message
          : `Inventory request failed with status ${response.status}`,
        typeof body?.code === 'string' ? body.code : undefined,
        typeof body?.statusCode === 'number' ? body.statusCode : response.status,
        body?.details,
      );
    }

    return response.json() as Promise<T>;
  }
}

export const inventoryApi = new InventoryApiClient();
