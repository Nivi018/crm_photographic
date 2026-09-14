import { useEffect, useEffectEvent, useState } from 'react';
import { useOptionalInventoryApi } from '../features/inventory/application/inventory-api-context';
import { type ApiResponse } from '@crm-photografy/shared';
import { inventoryApi, type ArticleRecord } from './api-client';

export interface ArticleRecordClient {
  findArticle(id: string): Promise<ApiResponse<ArticleRecord>>;
}

export function useArticleRecord(id: string, client?: ArticleRecordClient) {
  const injectedInventoryApi = useOptionalInventoryApi();
  const articleClient = client ?? injectedInventoryApi ?? inventoryApi;
  const [article, setArticle] = useState<ArticleRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const reload = useEffectEvent(async () => {
    try {
      setArticle((await articleClient.findArticle(id)).data);
    } catch {
      setError('No se pudo cargar el articulo para editarlo.');
    } finally {
      setIsLoading(false);
    }
  });

  useEffect(() => {
    void reload();
  }, [id]);

  return { article, error, isLoading, reload };
}
