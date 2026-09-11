import { ArticleType } from '@crm-photografy/shared';
import type { ChangeEvent, ReactElement } from 'react';
import { DataState, DataTable, Field, Pagination } from '../components/controls';
import type { ArticleListClient } from './use-article-list';
import { useArticleList } from './use-article-list';

export function ArticleListScreen({ client }: { client?: ArticleListClient }): ReactElement {
  const { error, filters, isLoading, page, result, setPage, updateFilters } =
    useArticleList(client);

  function updateName(event: ChangeEvent<HTMLInputElement>) {
    updateFilters({ name: event.target.value });
  }

  function updateCategory(event: ChangeEvent<HTMLInputElement>) {
    updateFilters({ categoryId: event.target.value || undefined });
  }

  function updateType(event: ChangeEvent<HTMLSelectElement>) {
    updateFilters({ type: (event.target.value || undefined) as ArticleType | undefined });
  }

  function updateState(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    updateFilters({ isActive: value === '' ? undefined : value === 'true' });
  }

  return (
    <main className="article-list">
      <header className="article-list__header">
        <div>
          <h1>Inventario</h1>
          <p>Consulta existencias y localiza articulos del estudio.</p>
        </div>
      </header>

      <section aria-label="Filtros de inventario" className="article-filters">
        <Field label="Buscar por nombre">
          <input
            onChange={updateName}
            placeholder="Buscar articulo"
            type="search"
            value={filters.name}
          />
        </Field>
        <Field label="Estado">
          <select onChange={updateState} value={String(filters.isActive ?? '')}>
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </Field>
        <Field label="Tipo">
          <select onChange={updateType} value={filters.type ?? ''}>
            <option value="">Todos</option>
            <option value={ArticleType.Sale}>Para venta</option>
            <option value={ArticleType.InternalSupply}>Insumo interno</option>
          </select>
        </Field>
        <Field label="Categoria">
          <input
            onChange={updateCategory}
            placeholder="ID de categoria"
            value={filters.categoryId ?? ''}
          />
        </Field>
      </section>

      {isLoading ? <DataState title="Cargando inventario">Buscando articulos...</DataState> : null}
      {error ? <DataState title="No se pudo cargar el inventario">{error}</DataState> : null}
      {!isLoading && !error && result?.data.length === 0 ? (
        <DataState title="No hay articulos">
          Ajusta los filtros o crea el primer articulo.
        </DataState>
      ) : null}
      {!isLoading && !error && result?.data.length ? (
        <section className="article-results" aria-label="Articulos encontrados">
          <DataTable headers={['Articulo', 'Tipo', 'Categoria', 'Existencia', 'Estado']}>
            {result.data.map((article) => {
              const isLowStock = article.isActive && article.hasLowStock;
              return (
                <tr key={article.id}>
                  <td>
                    <strong>{article.name}</strong>
                  </td>
                  <td>{article.type === ArticleType.Sale ? 'Para venta' : 'Insumo interno'}</td>
                  <td>{article.categoryId}</td>
                  <td className={isLowStock ? 'stock-low' : undefined}>{article.currentStock}</td>
                  <td>
                    <span className={isLowStock ? 'status-chip status-chip--low' : 'status-chip'}>
                      {article.isActive ? (isLowStock ? 'Stock bajo' : 'Activo') : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              );
            })}
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
