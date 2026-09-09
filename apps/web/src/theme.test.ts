import { beforeEach, describe, expect, it } from 'vitest';
import { readTheme, saveTheme } from './theme';

describe('theme preference', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('uses light theme when no preference exists', () => {
    expect(readTheme()).toBe('light');
  });

  it('persists the selected theme', () => {
    expect(saveTheme('dark')).toBeNull();
    expect(readTheme()).toBe('dark');
  });

  it('uses session storage and informs the user when persistent storage fails', () => {
    const blockedStorage: Storage = {
      clear() {},
      getItem() {
        return null;
      },
      key() {
        return null;
      },
      get length() {
        return 0;
      },
      removeItem() {},
      setItem() {
        throw new Error('blocked');
      },
    };

    expect(saveTheme('dark', blockedStorage, sessionStorage)).toBe(
      'El tema se conservara solo durante esta pestana.',
    );
    expect(readTheme(blockedStorage, sessionStorage)).toBe('dark');
  });
});
