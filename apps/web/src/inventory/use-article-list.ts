import { ArticleType, type PaginatedResponse } from '@crm-photografy/shared';
import { useEffect, useEffectEvent, useState } from 'react';
import { inventoryApi, type ArticleListQuery, type ArticleRecord } from './api-client';

export interface ArticleListFilters {
  categoryId: string | undefined;
  isActive: boolean | undefined;
  name: string;
  type: ArticleType | undefined;
}

export interface ArticleListClient {
  listArticles(query: ArticleListQuery): Promise<PaginatedResponse<ArticleRecord>>;
}

const initialFilters: ArticleListFilters = {
  categoryId: undefined,
  isActive: undefined,
  name: '',
  type: undefined,
};

export function useArticleList(client: ArticleListClient = inventoryApi) {
  const [filters, setFilters] = useState<ArticleListFilters>(initialFilters);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PaginatedResponse<ArticleRecord> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadArticles = useEffectEvent(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const query: ArticleListQuery = { name: filters.name, page };
      if (filters.categoryId !== undefined) query.categoryId = filters.categoryId;
      if (filters.isActive !== undefined) query.isActive = filters.isActive;
      if (filters.type !== undefined) query.type = filters.type;
      setResult(await client.listArticles(query));
    } catch {
      setError('No se pudo cargar el inventario. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  });

  useEffect(() => {
    void loadArticles();
  }, [filters, page]);

  function updateFilters(nextFilters: Partial<ArticleListFilters>) {
    setFilters((currentFilters) => ({ ...currentFilters, ...nextFilters }));
    setPage(1);
  }

  return { error, filters, isLoading, page, result, setPage, updateFilters };
}
