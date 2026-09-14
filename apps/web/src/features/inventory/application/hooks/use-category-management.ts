import { useState } from 'react';
import { useOptionalInventoryApi } from '../inventory-api-context';
import type { InventoryApiPort } from '../ports/inventory-api.port';
import { reconcileCategoryMutation } from '../reconciliation/reconcile-category-mutation';
import type { CategoryMutation } from '../../domain/reconciliation-policy';
import type { CategoryResponse } from '@crm-photografy/shared';
import { useMutationReconciliation } from '../../../../inventory/use-mutation-reconciliation';
import { useInventoryQuery } from './use-inventory-query';

export type CategoryManagementClient = Pick<
  InventoryApiPort,
  | 'createCategory'
  | 'deactivateCategory'
  | 'deleteCategory'
  | 'listCategories'
  | 'reactivateCategory'
  | 'updateCategory'
>;

export function useCategoryManagement(client?: CategoryManagementClient) {
  const injectedInventoryApi = useOptionalInventoryApi();
  const inventoryApi = client ?? injectedInventoryApi;
  if (!inventoryApi) throw new Error('La gestion de categorias requiere un puerto de inventario.');
  const categoryApi = inventoryApi;
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [name, setName] = useState('');
  const [editingCategory, setEditingCategory] = useState<CategoryResponse | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deletingCategory, setDeletingCategory] = useState<CategoryResponse | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const reconciliation = useMutationReconciliation();
  const query = useInventoryQuery({
    errorMessage: () => 'No se pudieron cargar las categorias. Intenta nuevamente.',
    query: () =>
      categoryApi.listCategories({ ...(isActive === undefined ? {} : { isActive }), page }),
    queryKey: `${isActive ?? 'all'}:${page}`,
  });

  async function execute(
    action: () => Promise<unknown>,
    mutation: CategoryMutation,
  ): Promise<void> {
    if (reconciliation.isMutationBlocked) return;
    setActionError(null);
    try {
      const result = await reconciliation.execute(action, async () => {
        const decision = await reconcileCategoryMutation(mutation, categoryApi);
        await query.reload();
        return decision;
      });
      if (result) await query.reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'No se pudo completar la accion.');
    }
  }

  function updateState(next: boolean | undefined): void {
    setIsActive(next);
    setPage(1);
  }

  async function createCategory(): Promise<void> {
    const nextName = name.trim();
    if (!nextName) return;
    await execute(() => categoryApi.createCategory(nextName), { kind: 'create', name: nextName });
    setName('');
  }

  function startEditing(category: CategoryResponse): void {
    setEditingCategory(category);
    setEditingName(category.name);
  }

  async function saveEdit(): Promise<void> {
    if (!editingCategory || !editingName.trim()) return;
    const nextName = editingName.trim();
    await execute(
      () =>
        categoryApi.updateCategory(editingCategory.id, {
          expectedVersion: editingCategory.version,
          name: nextName,
        }),
      {
        id: editingCategory.id,
        input: { expectedVersion: editingCategory.version, name: nextName },
        kind: 'update',
      },
    );
    setEditingCategory(null);
  }

  async function toggleCategoryState(category: CategoryResponse): Promise<void> {
    await execute(
      () =>
        category.isActive
          ? categoryApi.deactivateCategory(category.id, category.version)
          : categoryApi.reactivateCategory(category.id, category.version),
      {
        expectedVersion: category.version,
        id: category.id,
        isActive: !category.isActive,
        kind: 'state',
      },
    );
  }

  async function confirmDeletion(): Promise<void> {
    if (!deletingCategory) return;
    await execute(() => categoryApi.deleteCategory(deletingCategory.id, deletingCategory.version), {
      expectedVersion: deletingCategory.version,
      id: deletingCategory.id,
      kind: 'delete',
    });
    setDeletingCategory(null);
  }

  return {
    actionError,
    cancelEditing: () => setEditingCategory(null),
    cancelDeletion: () => setDeletingCategory(null),
    confirmDeletion,
    createCategory,
    deletingCategory,
    editingCategory,
    editingName,
    error: query.error,
    isActive,
    isLoading: query.isLoading,
    name,
    page,
    reconciliation,
    reload: query.reload,
    result: query.result,
    saveEdit,
    setEditingName,
    setName,
    setPage,
    startEditing,
    startDeletion: setDeletingCategory,
    toggleCategoryState,
    updateState,
  };
}
