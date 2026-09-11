import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MutationReconciliationNotice } from './mutation-reconciliation-notice';

describe('MutationReconciliationNotice', () => {
  const handlers = {
    onConfirmManualRetry: vi.fn(),
    onRetryMutation: vi.fn(),
    onRetryReconciliation: vi.fn(),
  };

  it('communicates verification progress without offering a retry', () => {
    render(<MutationReconciliationNotice phase="verifying" {...handlers} />);

    expect(screen.getByRole('status')).toHaveTextContent('Verificando resultado');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('confirms an applied mutation without offering a retry', () => {
    const { container } = render(
      <MutationReconciliationNotice currentData="Papel; stock 3." phase="applied" {...handlers} />,
    );

    expect(within(container).getByRole('status')).toHaveTextContent('No la repitas.');
    expect(within(container).queryByRole('button')).not.toBeInTheDocument();
  });

  it('offers only the approved action for every retryable outcome', () => {
    const { rerender } = render(<MutationReconciliationNotice phase="not-applied" {...handlers} />);
    expect(screen.getByRole('button', { name: 'Reintentar operacion' })).toBeInTheDocument();

    rerender(<MutationReconciliationNotice phase="indeterminate" {...handlers} />);
    expect(screen.getByRole('button', { name: 'Confirmar reintento manual' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reintentar operacion' })).not.toBeInTheDocument();

    rerender(<MutationReconciliationNotice phase="query-failed" {...handlers} />);
    expect(screen.getByRole('alert')).toHaveTextContent('La operacion permanece bloqueada.');
    expect(screen.getByRole('button', { name: 'Reintentar verificacion' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reintentar operacion' })).not.toBeInTheDocument();
  });
});
