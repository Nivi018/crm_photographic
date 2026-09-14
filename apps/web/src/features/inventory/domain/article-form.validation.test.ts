import { ArticleType, INVENTORY_LIMITS } from '@crm-photografy/shared';
import { describe, expect, it } from 'vitest';
import { validateArticleForm } from './article-form.validation';

describe('validateArticleForm', () => {
  it('rejects missing, malformed and out-of-range article fields', () => {
    expect(
      validateArticleForm({
        categoryId: ' ',
        initialStock: '-1',
        minimumStock: String(INVENTORY_LIMITS.maximumQuantity + 1),
        name: ' ',
        type: '',
      }),
    ).toEqual({
      categoryId: 'Selecciona una categoria activa.',
      initialStock: 'Ingresa un numero entero no negativo.',
      minimumStock: `La cantidad maxima es ${INVENTORY_LIMITS.maximumQuantity}.`,
      name: 'El nombre es obligatorio.',
      type: 'Selecciona un tipo de articulo.',
    });
  });

  it('accepts a complete article form with zero stock', () => {
    expect(
      validateArticleForm({
        categoryId: 'category-1',
        initialStock: '0',
        minimumStock: '0',
        name: 'Papel fotografico',
        type: ArticleType.InternalSupply,
      }),
    ).toEqual({});
  });
});
