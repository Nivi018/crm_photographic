import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const preferenceKey = 'crm-photografy.theme';

export function useTheme(): { message: string | null; theme: Theme; toggleTheme: () => void } {
  const [theme, setTheme] = useState<Theme>(() => readTheme());
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function toggleTheme(): void {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    setMessage(saveTheme(nextTheme));
  }

  return { message, theme, toggleTheme };
}

export function readTheme(
  persistentStorage = localStorage,
  fallbackStorage = sessionStorage,
): Theme {
  return readStorage(persistentStorage) ?? readStorage(fallbackStorage) ?? 'light';
}

export function saveTheme(
  theme: Theme,
  persistentStorage = localStorage,
  fallbackStorage = sessionStorage,
): string | null {
  try {
    persistentStorage.setItem(preferenceKey, theme);
    return null;
  } catch {
    try {
      fallbackStorage.setItem(preferenceKey, theme);
    } catch {
      // The selected theme remains available in React state for this visit.
    }

    return 'El tema se conservara solo durante esta pestana.';
  }
}

function readStorage(storage: Storage): Theme | null {
  try {
    const value = storage.getItem(preferenceKey);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}
