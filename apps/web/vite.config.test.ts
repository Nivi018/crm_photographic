import config from './vite.config';
import { describe, expect, it } from 'vitest';

describe('Vite development server', () => {
  it('forwards API requests to the local backend', () => {
    expect(config.server).toMatchObject({
      proxy: {
        '/api': { target: 'http://127.0.0.1:3002' },
      },
    });
  });
});
