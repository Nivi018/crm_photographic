import { type PaginatedResponse } from '@crm-photografy/shared';

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

  listArticles(): Promise<PaginatedResponse<ArticleRecord>> {
    return this.get('/articles?page=1');
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
