import { ArticleType, type PaginatedResponse } from '@crm-photografy/shared';
import { useEffect, useEffectEvent, useState } from 'react';
import { inventoryApi, type ArticleListQuery, type ArticleRecord } from './api-client';

export interface ArticleListFilters {
  categoryId?: string;
  isActive?: boolean;
  name: string;
  type?: ArticleType;
}

export interface ArticleListClient {
  listArticles(query: ArticleListQuery): Promise<PaginatedResponse<ArticleRecord>>;
}

const initialFilters: ArticleListFilters = { name: '' };

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
      setResult(await client.listArticles({ ...filters, page }));
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
