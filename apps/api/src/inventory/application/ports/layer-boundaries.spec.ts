import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const applicationDirectory = join(__dirname, '..');
const inventoryDirectory = join(__dirname, '../..');

describe('inventory layer boundaries', () => {
  it('keeps Prisma and infrastructure adapters outside application and domain', async () => {
    const sourceFiles = [
      ...(await sourceFilesIn(applicationDirectory)),
      ...(await sourceFilesIn(join(inventoryDirectory, 'domain'))),
    ];

    const sources = await Promise.all(
      sourceFiles.map(async (file) => ({ file, source: await readFile(file, 'utf8') })),
    );

    expect(
      sources.every(
        ({ source }) =>
          !/from\s+['"][^'"]*(?:infrastructure\/prisma|@prisma|generated\/client)/.test(source),
      ),
    ).toBe(true);
  });
});

async function sourceFilesIn(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);

      if (entry.isDirectory()) {
        return sourceFilesIn(path);
      }

      return entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts') ? [path] : [];
    }),
  );

  return paths.flat();
}
