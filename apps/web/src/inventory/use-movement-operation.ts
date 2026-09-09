import { useState } from 'react';
import { InventoryApiError } from './api-client';

export function useMovementOperation() {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  async function execute(operation: () => Promise<unknown>) {
    setError(null);
    setIsSubmitting(true);
    try {
      return await operation();
    } catch (cause) {
      setError(
        cause instanceof InventoryApiError ? cause.message : 'No se pudo registrar el movimiento.',
      );
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }
  return { error, execute, isSubmitting };
}
