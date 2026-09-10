import { describe, expect, it, vi } from 'vitest';

import { ArticleService } from '../../articles/article.service';
import { ListArticleMovementsUseCase } from './list-article-movements.use-case';
import { ListMovementsUseCase } from './list-movements.use-case';
import { RegisterDeltaAdjustmentUseCase } from './register-delta-adjustment.use-case';
import { RegisterEntryUseCase } from './register-entry.use-case';
import { RegisterExitUseCase } from './register-exit.use-case';
import { RegisterFinalStockAdjustmentUseCase } from './register-final-stock-adjustment.use-case';

describe('movement use cases', () => {
  it('delegates each movement operation through its own executable module', async () => {
    const methods = {
      listMovements: vi.fn().mockResolvedValue('listed'),
      listArticleMovements: vi.fn().mockResolvedValue('article-listed'),
      registerEntry: vi.fn().mockResolvedValue('entry'),
      registerExit: vi.fn().mockResolvedValue('exit'),
      registerFinalStockAdjustment: vi.fn().mockResolvedValue('final-adjustment'),
      registerDeltaAdjustment: vi.fn().mockResolvedValue('delta-adjustment'),
    };
    const service = methods as unknown as ArticleService;

    await expect(new ListMovementsUseCase(service).execute({ page: 1 })).resolves.toBe('listed');
    await expect(
      new ListArticleMovementsUseCase(service).execute({ articleId: 'article-1', page: 1 }),
    ).resolves.toBe('article-listed');
    await expect(new RegisterEntryUseCase(service).execute({} as never)).resolves.toBe('entry');
    await expect(new RegisterExitUseCase(service).execute({} as never)).resolves.toBe('exit');
    await expect(
      new RegisterFinalStockAdjustmentUseCase(service).execute({} as never),
    ).resolves.toBe('final-adjustment');
    await expect(new RegisterDeltaAdjustmentUseCase(service).execute({} as never)).resolves.toBe(
      'delta-adjustment',
    );

    expect(methods.listMovements).toHaveBeenCalledOnce();
    expect(methods.listArticleMovements).toHaveBeenCalledWith('article-1', {
      articleId: 'article-1',
      page: 1,
    });
    expect(methods.registerEntry).toHaveBeenCalledOnce();
    expect(methods.registerExit).toHaveBeenCalledOnce();
    expect(methods.registerFinalStockAdjustment).toHaveBeenCalledOnce();
    expect(methods.registerDeltaAdjustment).toHaveBeenCalledOnce();
  });
});
