import { ArticleType } from '@crm-photografy/shared';
import { useState, type FormEvent, type ReactElement } from 'react';
import { DataState, Field } from '../components/controls';
import type { ArticleRecord } from './api-client';
import type { ArticleFormClient } from './use-article-form';
import { useArticleForm } from './use-article-form';
import type { ActiveCategoryClient } from './use-active-categories';
import { useActiveCategories } from './use-active-categories';
import type { ArticleRecordClient } from './use-article-record';
import { useArticleRecord } from './use-article-record';
import { MutationReconciliationNotice } from './mutation-reconciliation-notice';

export function ArticleEditScreen({
  articleClient,
  articleId,
  categoryClient,
  client,
}: {
  articleClient?: ArticleRecordClient | undefined;
  articleId: string;
  categoryClient?: ActiveCategoryClient | undefined;
  client?: ArticleFormClient | undefined;
}): ReactElement {
  const { article, error, isLoading } = useArticleRecord(articleId, articleClient);
  if (isLoading) return <DataState title="Cargando articulo">Preparando la edicion...</DataState>;
  if (error || !article)
    return <DataState title="No se pudo cargar el articulo">{error}</DataState>;
  return <ArticleFormScreen article={article} categoryClient={categoryClient} client={client} />;
}

export function ArticleFormScreen({
  article,
  categoryClient,
  client,
}: {
  article?: ArticleRecord;
  categoryClient?: ActiveCategoryClient | undefined;
  client?: ArticleFormClient | undefined;
}): ReactElement {
  const { categories, error: categoryError, isLoading } = useActiveCategories(categoryClient);
  const {
    confirmManualRetry,
    currentData,
    errors,
    isMutationBlocked,
    isSubmitting,
    phase,
    retryMutation,
    retryReconciliation,
    setValue,
    submit,
    submitError,
    values,
  } = useArticleForm(client, article);
  const [success, setSuccess] = useState<string | null>(null);
  const isEditing = article !== undefined;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await submit();
    if (saved)
      setSuccess(
        isEditing ? 'Articulo actualizado correctamente.' : 'Articulo creado correctamente.',
      );
  }

  if (isLoading)
    return <DataState title="Cargando categorias">Preparando el formulario...</DataState>;
  if (categoryError)
    return <DataState title="No se pudo preparar el formulario">{categoryError}</DataState>;
  if (!categories.length) {
    return (
      <DataState title="No hay categorias activas">
        Crea o reactiva una categoria antes de registrar un articulo.
      </DataState>
    );
  }

  return (
    <main className="article-form-page">
      <header className="article-form-page__header">
        <h1>{isEditing ? 'Editar articulo' : 'Nuevo articulo'}</h1>
        <p>
          {isEditing
            ? 'Actualiza la informacion del articulo.'
            : 'Registra un articulo en el inventario.'}
        </p>
      </header>
      <form className="article-form" onSubmit={handleSubmit}>
        <Field error={errors.name} label="Nombre">
          <input onChange={(event) => setValue('name', event.target.value)} value={values.name} />
        </Field>
        <Field error={errors.type} label="Tipo">
          <select
            onChange={(event) => setValue('type', event.target.value as ArticleType | '')}
            value={values.type}
          >
            <option value="">Selecciona un tipo</option>
            <option value={ArticleType.Sale}>Para venta</option>
            <option value={ArticleType.InternalSupply}>Insumo interno</option>
          </select>
        </Field>
        <Field error={errors.categoryId} label="Categoria">
          <select
            onChange={(event) => setValue('categoryId', event.target.value)}
            value={values.categoryId}
          >
            <option value="">Selecciona una categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
        <Field error={errors.initialStock} label="Stock inicial">
          <input
            inputMode="numeric"
            onChange={(event) => setValue('initialStock', event.target.value)}
            value={values.initialStock}
          />
        </Field>
        <Field error={errors.minimumStock} label="Stock minimo">
          <input
            inputMode="numeric"
            onChange={(event) => setValue('minimumStock', event.target.value)}
            value={values.minimumStock}
          />
        </Field>
        {submitError ? <p role="alert">{submitError}</p> : null}
        {success ? <p role="status">{success}</p> : null}
        <MutationReconciliationNotice
          currentData={currentData}
          onConfirmManualRetry={confirmManualRetry}
          onRetryMutation={() => void retryMutation()}
          onRetryReconciliation={() => void retryReconciliation()}
          phase={phase}
        />
        <div className="article-form__actions">
          <a href="/inventory">Cancelar</a>
          <button disabled={isSubmitting || isMutationBlocked} type="submit">
            {isSubmitting ? 'Guardando...' : 'Guardar articulo'}
          </button>
        </div>
      </form>
    </main>
  );
}
