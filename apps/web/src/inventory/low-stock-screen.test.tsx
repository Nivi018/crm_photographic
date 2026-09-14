import {
  ArticleType,
  type ApiPaginatedResponse,
  type ArticleResponse,
} from '@crm-photografy/shared';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./api-client', () => ({
  inventoryApi: { listLowStock: vi.fn() },
}));

import { inventoryApi } from './api-client';
import { LowStockScreen } from './low-stock-screen';

const response: ApiPaginatedResponse<ArticleResponse> = {
  data: [
    {
      categoryId: 'category-1',
      currentStock: 1,
      hasLowStock: true,
      id: 'article-1',
      initialStock: 4,
      isActive: true,
      minimumStock: 2,
      name: 'Papel fotografico',
      type: ArticleType.InternalSupply,
      version: 2,
    },
  ],
  meta: { page: 1, pageSize: 25, totalItems: 1, totalPages: 1 },
};

describe('LowStockScreen', () => {
  it('shows only the active low-stock alert data returned by the existing endpoint', async () => {
    vi.mocked(inventoryApi.listLowStock).mockResolvedValue(response);

    render(<LowStockScreen client={inventoryApi} />);

    expect(await screen.findByText('Papel fotografico')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(inventoryApi.listLowStock).toHaveBeenCalledWith(1);
  });
});
