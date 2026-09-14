import { ArticleType, type ApiResponse } from '@crm-photografy/shared';
import { useState } from 'react';
import { useOptionalInventoryApi } from '../features/inventory/application/inventory-api-context';
import type { InventoryApiPort } from '../features/inventory/application/ports/inventory-api.port';
import { reconcileArticleMutation } from '../features/inventory/application/reconciliation/reconcile-article-mutation';
import {
  type ArticleFormErrors,
  type ArticleFormValues,
} from '../features/inventory/domain/inventory.types';
import { validateArticleForm } from '../features/inventory/domain/article-form.validation';
import type { ArticleRecord } from './api-client';
import { useMutationReconciliation } from './use-mutation-reconciliation';

export type { ArticleFormValues } from '../features/inventory/domain/inventory.types';

export type ArticleFormClient = Pick<
  InventoryApiPort,
  'createArticle' | 'findArticle' | 'listArticles' | 'updateArticle'
>;

const emptyValues: ArticleFormValues = {
  categoryId: '',
  initialStock: '',
  minimumStock: '',
  name: '',
  type: '',
};

export function useArticleForm(client?: ArticleFormClient, article?: ArticleRecord) {
  const injectedInventoryApi = useOptionalInventoryApi();
  const inventoryApi = client ?? injectedInventoryApi;
  if (!inventoryApi)
    throw new Error('El formulario de articulos requiere un puerto de inventario.');
  const articleApi = inventoryApi;
  const [values, setValues] = useState<ArticleFormValues>(() => articleValues(article));
  const [errors, setErrors] = useState<ArticleFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const reconciliation = useMutationReconciliation();

  function setValue<Key extends keyof ArticleFormValues>(key: Key, value: ArticleFormValues[Key]) {
    setValues((currentValues) => ({ ...currentValues, [key]: value }));
  }

  async function submit(): Promise<ApiResponse<ArticleRecord> | null> {
    if (reconciliation.isMutationBlocked) return null;
    const validationErrors = validateArticleForm(values);
    setErrors(validationErrors);
    setSubmitError(null);
    if (Object.keys(validationErrors).length > 0) return null;

    const input = {
      categoryId: values.categoryId.trim(),
      initialStock: Number(values.initialStock),
      minimumStock: Number(values.minimumStock),
      name: values.name.trim(),
      type: values.type as ArticleType,
    };

    setIsSubmitting(true);
    try {
      return await reconciliation.execute(
        () =>
          article
            ? articleApi.updateArticle(article.id, { ...input, expectedVersion: article.version })
            : articleApi.createArticle(input),
        () =>
          reconcileArticleMutation(
            article
              ? {
                  id: article.id,
                  input: { ...input, expectedVersion: article.version },
                  kind: 'update',
                }
              : { input, kind: 'create' },
            articleApi,
          ),
      );
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'No se pudo guardar el articulo.');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }

  return { ...reconciliation, errors, isSubmitting, setValue, submit, submitError, values };
}

function articleValues(article?: ArticleRecord): ArticleFormValues {
  if (!article) return emptyValues;
  return {
    categoryId: article.categoryId,
    initialStock: String(article.initialStock),
    minimumStock: String(article.minimumStock),
    name: article.name,
    type: article.type,
  };
}
