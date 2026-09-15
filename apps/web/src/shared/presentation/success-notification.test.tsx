import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SuccessNotification } from './success-notification';

describe('SuccessNotification', () => {
  it('announces the latest message and dismisses it after five seconds', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    const { rerender } = render(
      <SuccessNotification message="Articulo creado correctamente." onDismiss={onDismiss} />,
    );

    rerender(<SuccessNotification message="Articulo actualizado correctamente." onDismiss={onDismiss} />);
    expect(screen.getByRole('status')).toHaveTextContent('Articulo actualizado correctamente.');

    act(() => vi.advanceTimersByTime(5_000));
    expect(onDismiss).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});
