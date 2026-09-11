import type { ReadinessResponse } from '@crm-photografy/shared';

import type { ReadinessCheckPort } from './readiness-check.port';

export class ReadinessCheckUseCase {
  constructor(private readonly readinessCheck: ReadinessCheckPort) {}

  async execute(): Promise<ReadinessResponse> {
    await this.readinessCheck.check();

    return { database: 'available', status: 'ready' };
  }
}
