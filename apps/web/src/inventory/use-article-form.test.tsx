import { ArticleType } from '@crm-photografy/shared';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useArticleForm } from './use-article-form';

describe('useArticleForm', () => {
  it('validates required values and sends typed, normalized article data', async () => {
    const createArticle = vi.fn().mockResolvedValue({});
    const updateArticle = vi.fn();
    const { result } = renderHook(() => useArticleForm({ createArticle, updateArticle }));

    await act(async () => result.current.submit());
    expect(result.current.errors).toMatchObject({
      categoryId: expect.any(String),
      initialStock: expect.any(String),
      minimumStock: expect.any(String),
      name: expect.any(String),
      type: expect.any(String),
    });

    act(() => {
      result.current.setValue('name', '  Papel fotografico  ');
      result.current.setValue('type', ArticleType.InternalSupply);
      result.current.setValue('categoryId', 'category-1');
      result.current.setValue('initialStock', '12');
      result.current.setValue('minimumStock', '3');
    });
    await act(async () => result.current.submit());

    expect(createArticle).toHaveBeenCalledWith({
      categoryId: 'category-1',
      initialStock: 12,
      minimumStock: 3,
      name: 'Papel fotografico',
      type: ArticleType.InternalSupply,
    });
  });

  it('exposes the server error after a valid submission', async () => {
    const createArticle = vi.fn().mockRejectedValue(new Error('El nombre ya existe.'));
    const { result } = renderHook(() => useArticleForm({ createArticle, updateArticle: vi.fn() }));

    act(() => {
      result.current.setValue('name', 'Papel');
      result.current.setValue('type', ArticleType.Sale);
      result.current.setValue('categoryId', 'category-1');
      result.current.setValue('initialStock', '0');
      result.current.setValue('minimumStock', '0');
    });
    await act(async () => result.current.submit());

    await waitFor(() => expect(result.current.submitError).toBe('El nombre ya existe.'));
  });
});
