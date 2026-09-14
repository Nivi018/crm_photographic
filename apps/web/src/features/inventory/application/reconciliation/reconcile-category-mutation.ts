import type { InventoryApiPort } from '../ports/inventory-api.port';
import {
  decideCategoryMutation,
  type CategoryMutation,
  type ReconciliationDecision,
} from '../../domain/reconciliation-policy';

export async function reconcileCategoryMutation(
  mutation: CategoryMutation,
  inventoryApi: Pick<InventoryApiPort, 'listCategories'>,
): Promise<ReconciliationDecision> {
  const categories = await loadAllCategories(inventoryApi);
  const category =
    mutation.kind === 'create'
      ? categories.find((item) => item.name === mutation.name)
      : categories.find((item) => item.id === mutation.id);
  return decideCategoryMutation(mutation, category);
}

async function loadAllCategories(inventoryApi: Pick<InventoryApiPort, 'listCategories'>) {
  const firstPage = await inventoryApi.listCategories({ page: 1 });
  const categories = [...firstPage.data];
  for (let page = 2; page <= firstPage.meta.totalPages; page += 1) {
    categories.push(...(await inventoryApi.listCategories({ page })).data);
  }
  return categories;
}
