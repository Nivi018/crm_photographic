import { ArticleType, INVENTORY_LIMITS, type ApiResponse } from '@crm-photografy/shared';
import { useState } from 'react';
import {
  inventoryApi,
  type ArticleInput,
  type ArticleRecord,
  type UpdateArticleInput,
} from './api-client';

export interface ArticleFormValues {
  categoryId: string;
  initialStock: string;
  minimumStock: string;
  name: string;
  type: ArticleType | '';
}

export interface ArticleFormClient {
  createArticle(input: ArticleInput): Promise<ApiResponse<ArticleRecord>>;
  updateArticle(id: string, input: UpdateArticleInput): Promise<ApiResponse<ArticleRecord>>;
}

type ArticleFormErrors = Partial<Record<keyof ArticleFormValues, string>>;

const emptyValues: ArticleFormValues = {
  categoryId: '',
  initialStock: '',
  minimumStock: '',
  name: '',
  type: '',
};

export function useArticleForm(client: ArticleFormClient = inventoryApi, article?: ArticleRecord) {
  const [values, setValues] = useState<ArticleFormValues>(() => articleValues(article));
  const [errors, setErrors] = useState<ArticleFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function setValue<Key extends keyof ArticleFormValues>(key: Key, value: ArticleFormValues[Key]) {
    setValues((currentValues) => ({ ...currentValues, [key]: value }));
  }

  async function submit(): Promise<ApiResponse<ArticleRecord> | null> {
    const validationErrors = validateArticleForm(values);
    setErrors(validationErrors);
    setSubmitError(null);
    if (Object.keys(validationErrors).length > 0) return null;

    const input: ArticleInput = {
      categoryId: values.categoryId.trim(),
      initialStock: Number(values.initialStock),
      minimumStock: Number(values.minimumStock),
      name: values.name.trim(),
      type: values.type as ArticleType,
    };

    setIsSubmitting(true);
    try {
      return article
        ? await client.updateArticle(article.id, {
            ...input,
            expectedVersion: article.version,
          })
        : await client.createArticle(input);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'No se pudo guardar el articulo.');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }

  return { errors, isSubmitting, setValue, submit, submitError, values };
}

export function validateArticleForm(values: ArticleFormValues): ArticleFormErrors {
  const errors: ArticleFormErrors = {};
  const name = values.name.trim();
  if (!name) errors.name = 'El nombre es obligatorio.';
  else if (name.length > INVENTORY_LIMITS.maximumArticleNameLength) {
    errors.name = `El nombre no puede superar ${INVENTORY_LIMITS.maximumArticleNameLength} caracteres.`;
  }
  if (!Object.values(ArticleType).includes(values.type as ArticleType)) {
    errors.type = 'Selecciona un tipo de articulo.';
  }
  if (!values.categoryId.trim()) errors.categoryId = 'Selecciona una categoria activa.';
  validateQuantity('initialStock', values.initialStock, errors);
  validateQuantity('minimumStock', values.minimumStock, errors);
  return errors;
}

function validateQuantity(
  field: 'initialStock' | 'minimumStock',
  value: string,
  errors: ArticleFormErrors,
) {
  if (!/^\d+$/.test(value)) {
    errors[field] = 'Ingresa un numero entero no negativo.';
  } else if (Number(value) > INVENTORY_LIMITS.maximumQuantity) {
    errors[field] = `La cantidad maxima es ${INVENTORY_LIMITS.maximumQuantity}.`;
  }
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
