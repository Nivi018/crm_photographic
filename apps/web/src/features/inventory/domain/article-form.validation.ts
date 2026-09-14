import { ArticleType, INVENTORY_LIMITS } from '@crm-photografy/shared';
import type { ArticleFormErrors, ArticleFormValues } from './inventory.types';

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
): void {
  if (!/^\d+$/.test(value)) {
    errors[field] = 'Ingresa un numero entero no negativo.';
  } else if (Number(value) > INVENTORY_LIMITS.maximumQuantity) {
    errors[field] = `La cantidad maxima es ${INVENTORY_LIMITS.maximumQuantity}.`;
  }
}
