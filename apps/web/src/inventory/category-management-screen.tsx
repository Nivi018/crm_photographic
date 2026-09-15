import { type FormEvent, type ReactElement } from 'react';
import { DataState, DataTable, Field, Pagination } from '../shared/presentation/controls';
import {
  type CategoryManagementClient,
  useCategoryManagement,
} from '../features/inventory/application/hooks/use-category-management';
import { MutationReconciliationNotice } from './mutation-reconciliation-notice';

export function CategoryManagementScreen({
  client,
}: {
  client?: CategoryManagementClient;
}): ReactElement {
  const categories = useCategoryManagement(client);
  function create(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void categories.createCategory();
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
          <input
            onChange={(event) => categories.setName(event.target.value)}
            required
            value={categories.name}
          />
        </Field>
        <button disabled={categories.reconciliation.isMutationBlocked} type="submit">
          Crear categoria
        </button>
        <Field label="Estado">
          <select
            onChange={(event) =>
              categories.updateState(
                event.target.value === '' ? undefined : event.target.value === 'true',
              )
            }
            value={String(categories.isActive ?? '')}
          >
            <option value="">Todas</option>
            <option value="true">Activas</option>
            <option value="false">Inactivas</option>
          </select>
        </Field>
      </form>
      {categories.isLoading ? (
        <DataState title="Cargando categorias">Consultando categorias...</DataState>
      ) : null}
      {categories.error || categories.actionError ? (
        <DataState title="No se pudo actualizar categorias">
          {categories.error ?? categories.actionError}
          <button onClick={() => void categories.reload()} type="button">
            Reintentar
          </button>
        </DataState>
      ) : null}
      <MutationReconciliationNotice
        currentData={categories.reconciliation.currentData}
        onConfirmManualRetry={categories.reconciliation.confirmManualRetry}
        onRetryMutation={() => void categories.reconciliation.retryMutation()}
        onRetryReconciliation={() => void categories.reconciliation.retryReconciliation()}
        phase={categories.reconciliation.phase}
      />
      {!categories.isLoading && !categories.error && categories.result?.data.length === 0 ? (
        <DataState title="No hay categorias">
          Crea la primera categoria para clasificar articulos.
        </DataState>
      ) : null}
      {categories.result?.data.length ? (
        <section className="article-results">
          <DataTable headers={['Categoria', 'Estado', 'Acciones']}>
            {categories.result.data.map((category) => (
              <tr key={category.id}>
                <td>
                  <strong>{category.name}</strong>
                </td>
                <td>
                  <span className="status-chip">{category.isActive ? 'Activa' : 'Inactiva'}</span>
                </td>
                <td>
                  <button
                    disabled={categories.reconciliation.isMutationBlocked}
                    onClick={() => categories.startEditing(category)}
                    type="button"
                  >
                    Editar
                  </button>
                  <button
                    disabled={categories.reconciliation.isMutationBlocked}
                    onClick={() => void categories.toggleCategoryState(category)}
                    type="button"
                  >
                    {category.isActive ? 'Desactivar' : 'Reactivar'}
                  </button>
                  <button
                    disabled={categories.reconciliation.isMutationBlocked}
                    onClick={() => categories.startDeletion(category)}
                    type="button"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>
          <Pagination
            onPageChange={categories.setPage}
            page={categories.page}
            totalPages={Math.max(categories.result.meta.totalPages, 1)}
          />
        </section>
      ) : null}
      {categories.editingCategory ? (
        <section aria-labelledby="edit-category-title" role="dialog">
          <h2 id="edit-category-title">Editar categoria</h2>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void categories.saveEdit();
            }}
          >
            <Field label="Nombre de categoria">
              <input
                autoFocus
                onChange={(event) => categories.setEditingName(event.target.value)}
                required
                value={categories.editingName}
              />
            </Field>
            <button type="submit">Guardar</button>
            <button onClick={categories.cancelEditing} type="button">
              Cancelar
            </button>
          </form>
        </section>
      ) : null}
      {categories.deletingCategory ? (
        <section
          aria-describedby="delete-category-description"
          aria-labelledby="delete-category-title"
          role="alertdialog"
        >
          <h2 id="delete-category-title">Eliminar categoria</h2>
          <p id="delete-category-description">
            Eliminaras {categories.deletingCategory.name} de forma permanente.
          </p>
          <button onClick={() => void categories.confirmDeletion()} type="button">
            Confirmar eliminacion
          </button>
          <button onClick={categories.cancelDeletion} type="button">
            Cancelar
          </button>
        </section>
      ) : null}
    </main>
  );
}
