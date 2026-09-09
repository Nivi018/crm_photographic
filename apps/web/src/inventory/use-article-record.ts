import { useEffect, useEffectEvent, useState } from 'react';
import { inventoryApi, type ArticleRecord } from './api-client';

export interface ArticleRecordClient {
  findArticle(id: string): Promise<ArticleRecord>;
}

export function useArticleRecord(id: string, client: ArticleRecordClient = inventoryApi) {
  const [article, setArticle] = useState<ArticleRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const reload = useEffectEvent(async () => {
    try {
      setArticle(await client.findArticle(id));
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
