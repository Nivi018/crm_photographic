import { useEffect, useEffectEvent, useRef, useState } from 'react';

export interface InventoryQueryState<Result> {
  error: string | null;
  isLoading: boolean;
  reload: () => Promise<void>;
  result: Result | null;
}

export function useInventoryQuery<Result>({
  errorMessage,
  query,
  queryKey,
}: {
  errorMessage: (cause: unknown) => string;
  query: () => Promise<Result>;
  queryKey: string;
}): InventoryQueryState<Result> {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<Result | null>(null);
  const latestRequestId = useRef(0);

  const reload = useEffectEvent(async () => {
    const requestId = ++latestRequestId.current;
    setError(null);
    setIsLoading(true);

    try {
      const nextResult = await query();
      if (requestId === latestRequestId.current) setResult(nextResult);
    } catch (cause) {
      if (requestId === latestRequestId.current) setError(errorMessage(cause));
    } finally {
      if (requestId === latestRequestId.current) setIsLoading(false);
    }
  });

  useEffect(() => {
    void reload();
  }, [queryKey]);

  return { error, isLoading, reload, result };
}
