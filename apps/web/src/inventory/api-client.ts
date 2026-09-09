import { ArticleType, type PaginatedResponse } from '@crm-photografy/shared';

export interface ArticleListQuery {
  categoryId?: string;
  isActive?: boolean;
  name?: string;
  page?: number;
  type?: ArticleType;
}

export interface CategoryRecord {
  entity: { id: string; isActive: boolean; name: string };
  version: number;
}

export interface ArticleRecord {
  entity: {
    categoryId: string;
    currentStock: number;
    id: string;
    isActive: boolean;
    minimumStock: number;
    name: string;
    type: string;
  };
  version: number;
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

  listCategories(): Promise<PaginatedResponse<CategoryRecord>> {
    return this.get('/categories?page=1');
  }

  listMovements(): Promise<PaginatedResponse<MovementRecord>> {
    return this.get('/movements?page=1');
  }

  private async get<T>(path: string): Promise<T> {
    const response = await this.fetcher(`${this.baseUrl}${path}`);

    if (!response.ok) {
      throw new Error(`Inventory request failed with status ${response.status}`);
    }

    return response.json() as Promise<T>;
  }
}

export const inventoryApi = new InventoryApiClient();
