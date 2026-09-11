import { useState, type FormEvent, type ReactElement } from 'react';
import { DataState, DataTable, Field, Pagination } from '../components/controls';
import { inventoryApi, InventoryApiError } from './api-client';
import { type CategoryMutation, reconcileCategoryMutation } from './reconcile-inventory-mutation';
import { MutationReconciliationNotice } from './mutation-reconciliation-notice';
import { useCategoryList } from './use-category-list';
import { useMutationReconciliation } from './use-mutation-reconciliation';

export function CategoryManagementScreen(): ReactElement {
  const { error, isActive, isLoading, page, reload, result, setPage, updateState } =
    useCategoryList();
  const [name, setName] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const reconciliation = useMutationReconciliation();
  async function execute(action: () => Promise<unknown>, mutation: CategoryMutation) {
    if (reconciliation.isMutationBlocked) return;
    try {
      setActionError(null);
      const result = await reconciliation.execute(action, async () => {
        const decision = await reconcileCategoryMutation(mutation, inventoryApi);
        await reload();
        return decision;
      });
      if (result) await reload();
    } catch (cause) {
      setActionError(
        cause instanceof InventoryApiError ? cause.message : 'No se pudo completar la accion.',
      );
    }
  }
  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim()) {
      void execute(() => inventoryApi.createCategory(name), { kind: 'create', name });
      setName('');
    }
  }
  return (
    <main className="article-list">
      <header className="article-list__header">
        <div>
          <h1>Categorias</h1>
          <p>Organiza la clasificacion de los articulos del estudio.</p>
        </div>
      </header>
      <form className="article-filters" onSubmit={create}>
        <Field label="Nueva categoria">
          <input onChange={(event) => setName(event.target.value)} required value={name} />
        </Field>
        <button disabled={reconciliation.isMutationBlocked} type="submit">
          Crear categoria
        </button>
        <Field label="Estado">
          <select
            onChange={(event) =>
              updateState(event.target.value === '' ? undefined : event.target.value === 'true')
            }
            value={String(isActive ?? '')}
          >
            <option value="">Todas</option>
            <option value="true">Activas</option>
            <option value="false">Inactivas</option>
          </select>
        </Field>
      </form>
      {isLoading ? (
        <DataState title="Cargando categorias">Consultando categorias...</DataState>
      ) : null}
      {error || actionError ? (
        <DataState title="No se pudo actualizar categorias">{error ?? actionError}</DataState>
      ) : null}
      <MutationReconciliationNotice
        currentData={reconciliation.currentData}
        onConfirmManualRetry={reconciliation.confirmManualRetry}
        onRetryMutation={() => void reconciliation.retryMutation()}
        onRetryReconciliation={() => void reconciliation.retryReconciliation()}
        phase={reconciliation.phase}
      />
      {!isLoading && !error && result?.data.length === 0 ? (
        <DataState title="No hay categorias">
          Crea la primera categoria para clasificar articulos.
        </DataState>
      ) : null}
      {result?.data.length ? (
        <section className="article-results">
          <DataTable headers={['Categoria', 'Estado', 'Acciones']}>
            {result.data.map((category) => (
              <tr key={category.id}>
                <td>
                  <strong>{category.name}</strong>
                </td>
                <td>
                  <span className="status-chip">{category.isActive ? 'Activa' : 'Inactiva'}</span>
                </td>
                <td>
                  <button
                    disabled={reconciliation.isMutationBlocked}
                    onClick={() => {
                      const next = window.prompt('Nuevo nombre de categoria', category.name);
                      if (next)
                        void execute(
                          () =>
                            inventoryApi.updateCategory(category.id, {
                              expectedVersion: category.version,
                              name: next,
                            }),
                          {
                            id: category.id,
                            input: { expectedVersion: category.version, name: next },
                            kind: 'update',
                          },
                        );
                    }}
                    type="button"
                  >
                    Editar
                  </button>
                  <button
                    disabled={reconciliation.isMutationBlocked}
                    onClick={() =>
                      void execute(
                        () =>
                          category.isActive
                            ? inventoryApi.deactivateCategory(category.id, category.version)
                            : inventoryApi.reactivateCategory(category.id, category.version),
                        {
                          expectedVersion: category.version,
                          id: category.id,
                          isActive: !category.isActive,
                          kind: 'state',
                        },
                      )
                    }
                    type="button"
                  >
                    {category.isActive ? 'Desactivar' : 'Reactivar'}
                  </button>
                  <button
                    disabled={reconciliation.isMutationBlocked}
                    onClick={() => {
                      if (window.confirm('Eliminar esta categoria de forma permanente?'))
                        void execute(
                          () => inventoryApi.deleteCategory(category.id, category.version),
                          { expectedVersion: category.version, id: category.id, kind: 'delete' },
                        );
                    }}
                    type="button"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>
          <Pagination
            onPageChange={setPage}
            page={page}
            totalPages={Math.max(result.meta.totalPages, 1)}
          />
        </section>
      ) : null}
    </main>
  );
}
