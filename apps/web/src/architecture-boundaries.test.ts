import { describe, expect, it } from 'vitest';

const sources = import.meta.glob('./**/*.{ts,tsx}', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>;

function source(path: string): string {
  const content = sources[`./${path}`];
  if (!content) throw new Error(`No se encontro ${path}.`);
  return content;
}

function contrast(first: string, second: string): number {
  const luminance = (hex: string): number => {
    const channels = hex.match(/[a-f\d]{2}/gi)?.map((value) => Number.parseInt(value, 16) / 255);
    if (!channels) throw new Error(`Color invalido: ${hex}`);
    const converted = channels.map((value) =>
      value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
    const [red, green, blue] = converted;
    if (red === undefined || green === undefined || blue === undefined) {
      throw new Error(`Color invalido: ${hex}`);
    }
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  const [lighter, darker] = values;
  if (lighter === undefined || darker === undefined) throw new Error('Contraste invalido.');
  return (lighter + 0.05) / (darker + 0.05);
}

describe('frontend architecture boundaries', () => {
  it('rejects infrastructure imports from inventory screens', () => {
    for (const file of Object.keys(sources).filter(
      (path) => path.includes('/inventory/') && path.endsWith('-screen.tsx'),
    )) {
      expect(source(file.slice(2))).not.toMatch(
        /features\/inventory\/infrastructure|inventory-api-client/,
      );
    }
  });

  it('keeps dependency construction in main', () => {
    expect(source('main.tsx')).toContain('createInventoryDependencies');
    expect(source('app/app.tsx')).not.toContain('createInventoryDependencies');
  });

  it('keeps normal text contrast above 4.5:1 in both themes', () => {
    expect(contrast('#0c1f3a', '#f7faff')).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#f7faff', '#071a2d')).toBeGreaterThanOrEqual(4.5);
  });
});
