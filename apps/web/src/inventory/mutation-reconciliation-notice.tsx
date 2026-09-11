import type { ReactElement } from 'react';
import type { MutationReconciliationPhase } from './use-mutation-reconciliation';

export function MutationReconciliationNotice({
  currentData,
  onConfirmManualRetry,
  onRetryMutation,
  onRetryReconciliation,
  phase,
}: {
  currentData?: string | undefined;
  onConfirmManualRetry: () => void;
  onRetryMutation: () => void;
  onRetryReconciliation: () => void;
  phase: MutationReconciliationPhase;
}): ReactElement | null {
  if (phase === 'idle') return null;

  if (phase === 'verifying') {
    return (
      <section aria-live="polite" className="data-state">
        <h2>Verificando resultado</h2>
        <p>
          La operacion se envio, pero su resultado es incierto. Estamos consultando los datos
          actuales.
        </p>
      </section>
    );
  }

  if (phase === 'applied') {
    return (
      <section aria-live="polite" className="data-state">
        <h2>Operacion confirmada</h2>
        <p>La operacion se aplico correctamente. No la repitas.</p>
        {currentData ? <p>Datos actuales: {currentData}</p> : null}
      </section>
    );
  }

  if (phase === 'not-applied') {
    return (
      <section aria-live="polite" className="data-state">
        <h2>Operacion no aplicada</h2>
        <p>No se detectaron cambios. Puedes reintentar la operacion manualmente.</p>
        {currentData ? <p>Datos actuales: {currentData}</p> : null}
        <button onClick={onRetryMutation} type="button">
          Reintentar operacion
        </button>
      </section>
    );
  }

  if (phase === 'indeterminate') {
    return (
      <section aria-live="polite" className="data-state">
        <h2>Se requiere confirmacion</h2>
        <p>
          No fue posible determinar si la operacion se aplico. Revisa los datos actuales antes de
          habilitar un reintento.
        </p>
        {currentData ? <p>Datos actuales: {currentData}</p> : null}
        <button onClick={onConfirmManualRetry} type="button">
          Confirmar reintento manual
        </button>
      </section>
    );
  }

  return (
    <section aria-live="polite" className="data-state">
      <h2>No se pudo verificar la operacion</h2>
      <p>La operacion permanece bloqueada. Reintenta solo la consulta de verificacion.</p>
      <button onClick={onRetryReconciliation} type="button">
        Reintentar verificacion
      </button>
    </section>
  );
}
