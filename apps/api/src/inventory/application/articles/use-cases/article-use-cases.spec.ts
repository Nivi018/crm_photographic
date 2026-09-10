import { describe, expect, it, vi } from 'vitest';

import { ArticleService } from '../article.service';
import { CreateArticleUseCase } from './create-article.use-case';
import { DeactivateArticleUseCase } from './deactivate-article.use-case';
import { DeleteArticleUseCase } from './delete-article.use-case';
import { EditArticleUseCase } from './edit-article.use-case';
import { GetArticleUseCase } from './get-article.use-case';
import { ListArticlesUseCase } from './list-articles.use-case';
import { ListLowStockArticlesUseCase } from './list-low-stock-articles.use-case';
import { ReactivateArticleUseCase } from './reactivate-article.use-case';

describe('article use cases', () => {
  it('delegates each article operation through its own executable module', async () => {
    const methods = {
      create: vi.fn().mockResolvedValue('created'),
      findById: vi.fn().mockResolvedValue('found'),
      list: vi.fn().mockResolvedValue('listed'),
      listLowStock: vi.fn().mockResolvedValue('low-stock'),
      edit: vi.fn().mockResolvedValue('edited'),
      deactivate: vi.fn().mockResolvedValue('deactivated'),
      reactivate: vi.fn().mockResolvedValue('reactivated'),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    const service = methods as unknown as ArticleService;

    await expect(new CreateArticleUseCase(service).execute({} as never)).resolves.toBe('created');
    await expect(new GetArticleUseCase(service).execute({ id: 'article-1' })).resolves.toBe(
      'found',
    );
    await expect(new ListArticlesUseCase(service).execute({ page: 1 })).resolves.toBe('listed');
    await expect(new ListLowStockArticlesUseCase(service).execute({ page: 1 })).resolves.toBe(
      'low-stock',
    );
    await expect(new EditArticleUseCase(service).execute({} as never)).resolves.toBe('edited');
    await expect(new DeactivateArticleUseCase(service).execute({} as never)).resolves.toBe(
      'deactivated',
    );
    await expect(new ReactivateArticleUseCase(service).execute({} as never)).resolves.toBe(
      'reactivated',
    );
    await expect(new DeleteArticleUseCase(service).execute({} as never)).resolves.toBeUndefined();

    expect(methods.create).toHaveBeenCalledOnce();
    expect(methods.findById).toHaveBeenCalledOnce();
    expect(methods.list).toHaveBeenCalledOnce();
    expect(methods.listLowStock).toHaveBeenCalledOnce();
    expect(methods.edit).toHaveBeenCalledOnce();
    expect(methods.deactivate).toHaveBeenCalledOnce();
    expect(methods.reactivate).toHaveBeenCalledOnce();
    expect(methods.delete).toHaveBeenCalledOnce();
  });
});
