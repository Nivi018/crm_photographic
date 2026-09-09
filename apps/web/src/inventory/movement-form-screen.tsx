import { useState, type FormEvent, type ReactElement } from 'react';
import { DataState, Field } from '../components/controls';
import { inventoryApi } from './api-client';
import { useArticleRecord } from './use-article-record';
import { useMovementOperation } from './use-movement-operation';

type MovementType = 'entry' | 'exit' | 'final' | 'delta';

export function MovementFormScreen({ articleId }: { articleId: string }): ReactElement {
  const { article, error: articleError, isLoading } = useArticleRecord(articleId);
  const { error, execute, isSubmitting } = useMovementOperation();
  const [type, setType] = useState<MovementType>('entry');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [confirmNegativeStock, setConfirmNegativeStock] = useState(false);
  const [success, setSuccess] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!article) return;
    const value = Number(quantity);
    const input = {
      confirmNegativeStock,
      expectedVersion: article.version,
      quantity: value,
      reason,
    };
    const saved = await execute(() =>
      type === 'entry'
        ? inventoryApi.createEntry(articleId, input)
        : type === 'exit'
          ? inventoryApi.createExit(articleId, input)
          : type === 'delta'
            ? inventoryApi.createDeltaAdjustment(articleId, input)
            : inventoryApi.createFinalStockAdjustment(articleId, {
                expectedVersion: article.version,
                finalStock: value,
              }),
    );
    if (saved) setSuccess(true);
  }
  if (isLoading)
    return <DataState title="Cargando articulo">Preparando el movimiento...</DataState>;
  if (articleError || !article)
    return <DataState title="No se pudo cargar el articulo">{articleError}</DataState>;
  return (
    <main className="article-form-page">
      <header className="article-form-page__header">
        <h1>Registrar movimiento</h1>
        <p>
          {article.entity.name}. Stock actual: {article.entity.currentStock}.
        </p>
      </header>
      <form className="article-form" onSubmit={submit}>
        <Field label="Tipo de movimiento">
          <select onChange={(event) => setType(event.target.value as MovementType)} value={type}>
            <option value="entry">Entrada</option>
            <option value="exit">Salida</option>
            <option value="final">Ajuste por existencia final</option>
            <option value="delta">Ajuste por diferencia</option>
          </select>
        </Field>
        <Field label={type === 'final' ? 'Existencia final' : 'Cantidad'}>
          <input
            inputMode="numeric"
            min={type === 'delta' ? undefined : 0}
            onChange={(event) => setQuantity(event.target.value)}
            required
            value={quantity}
          />
        </Field>
        {type !== 'final' ? (
          <Field label="Motivo">
            <input onChange={(event) => setReason(event.target.value)} required value={reason} />
          </Field>
        ) : null}
        <label>
          <input
            checked={confirmNegativeStock}
            onChange={(event) => setConfirmNegativeStock(event.target.checked)}
            type="checkbox"
          />{' '}
          Confirmo continuar si el resultado queda con stock negativo.
        </label>
        {error ? <p role="alert">{error}</p> : null}
        {success ? <p role="status">Movimiento registrado correctamente.</p> : null}
        <div className="article-form__actions">
          <a href={`/inventory/articles/${articleId}`}>Cancelar</a>
          <button disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Registrando...' : 'Registrar movimiento'}
          </button>
        </div>
      </form>
    </main>
  );
}
