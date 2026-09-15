import { useEffect, type ReactElement } from 'react';

import './success-notification.css';

const DISPLAY_DURATION_MS = 5_000;

export function SuccessNotification({
  message,
  onDismiss,
}: {
  message: string | null;
  onDismiss: () => void;
}): ReactElement | null {
  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(onDismiss, DISPLAY_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [message, onDismiss]);

  return message ? (
    <p aria-live="polite" className="success-notification" role="status">
      {message}
    </p>
  ) : null;
}
