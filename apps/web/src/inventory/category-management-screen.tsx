import { useState, type FormEvent, type ReactElement } from 'react';
import { DataState, DataTable, Field, Pagination } from '../components/controls';
import { inventoryApi, InventoryApiError } from './api-client';
import { useCategoryList } from './use-category-list';

export function CategoryManagementScreen(): ReactElement {
  const { error, isActive, isLoading, page, reload, result, setPage, updateState } =
    useCategoryList();
  const [name, setName] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  async function execute(action: () => Promise<unknown>) {
    try {
      setActionError(null);
      await action();
      await reload();
    } catch (cause) {
      setActionError(
        cause instanceof InventoryApiError ? cause.message : 'No se pudo completar la accion.',
      );
    }
  }
  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim()) {
      void execute(() => inventoryApi.createCategory(name));
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
        <button type="submit">Crear categoria</button>
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
                    onClick={() => {
                      const next = window.prompt('Nuevo nombre de categoria', category.name);
                      if (next)
                        void execute(() =>
                          inventoryApi.updateCategory(category.id, {
                            expectedVersion: category.version,
                            name: next,
                          }),
                        );
                    }}
                    type="button"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() =>
                      void execute(() =>
                        category.isActive
                          ? inventoryApi.deactivateCategory(category.id, category.version)
                          : inventoryApi.reactivateCategory(category.id, category.version),
                      )
                    }
                    type="button"
                  >
                    {category.isActive ? 'Desactivar' : 'Reactivar'}
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Eliminar esta categoria de forma permanente?'))
                        void execute(() =>
                          inventoryApi.deleteCategory(category.id, category.version),
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
