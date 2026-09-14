import { ArticleType } from '@crm-photografy/shared';
import { useState } from 'react';
import { useOptionalInventoryApi } from '../features/inventory/application/inventory-api-context';
import { useInventoryQuery } from '../features/inventory/application/hooks/use-inventory-query';
import type {
  InventoryApiPort,
  InventoryArticleListQuery,
} from '../features/inventory/application/ports/inventory-api.port';

export interface ArticleListFilters {
  categoryId: string | undefined;
  isActive: boolean | undefined;
  name: string;
  type: ArticleType | undefined;
}

export type ArticleListClient = Pick<InventoryApiPort, 'listArticles'>;

const initialFilters: ArticleListFilters = {
  categoryId: undefined,
  isActive: undefined,
  name: '',
  type: undefined,
};

export function useArticleList(client?: ArticleListClient) {
  const injectedInventoryApi = useOptionalInventoryApi();
  const inventoryApi = client ?? injectedInventoryApi;
  if (!inventoryApi) throw new Error('La lista de articulos requiere un puerto de inventario.');
  const [filters, setFilters] = useState<ArticleListFilters>(initialFilters);
  const [page, setPage] = useState(1);
  const articleQuery: InventoryArticleListQuery = { name: filters.name, page };
  if (filters.categoryId !== undefined) articleQuery.categoryId = filters.categoryId;
  if (filters.isActive !== undefined) articleQuery.isActive = filters.isActive;
  if (filters.type !== undefined) articleQuery.type = filters.type;
  const query = useInventoryQuery({
    errorMessage: () => 'No se pudo cargar el inventario. Intenta nuevamente.',
    query: () => inventoryApi.listArticles(articleQuery),
    queryKey: JSON.stringify({ filters, page }),
  });

  function updateFilters(nextFilters: Partial<ArticleListFilters>) {
    setFilters((currentFilters) => ({ ...currentFilters, ...nextFilters }));
    setPage(1);
  }

  return { ...query, filters, page, setPage, updateFilters };
}
