import { describe, expect, it } from 'vitest';

import {
  RequiredTextError,
  normalizeName,
  normalizeReason,
  trimRequiredText,
} from './normalization';

describe('text normalization', () => {
  it('trims names, normalizes Unicode, removes diacritics, and lowercases for comparisons', () => {
    expect(normalizeName('  Ca\u0301mara \u00c1e\u0301rea  ')).toBe('camara aerea');
  });

  it('trims a reason while preserving its visible characters', () => {
    expect(normalizeReason('  Reposicio\u0301n por dan\u0303o  ')).toBe(
      'Reposicio\u0301n por dan\u0303o',
    );
  });

  it.each([
    ['name', '   '],
    ['reason', '\t\n'],
  ] as const)('rejects an empty %s after trimming', (field, value) => {
    expect(() => trimRequiredText(value, field)).toThrow(RequiredTextError);
    expect(() => trimRequiredText(value, field)).toThrow(`${field} is required`);
  });
});
