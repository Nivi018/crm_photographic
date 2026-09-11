import { Inject, Injectable } from '@nestjs/common';
import type { ApiResponse, LivenessResponse, ReadinessResponse } from '@crm-photografy/shared';

import { ReadinessCheckUseCase } from './health/application/readiness-check.use-case';
import { READINESS_CHECK_PORT } from './health/application/readiness-check.port';
import type { ReadinessCheckPort } from './health/application/readiness-check.port';

export type HealthResponse = ApiResponse<LivenessResponse>;
export type ReadinessHealthResponse = ApiResponse<ReadinessResponse>;

@Injectable()
export class HealthService {
  private readonly readinessCheck: ReadinessCheckUseCase;

  constructor(@Inject(READINESS_CHECK_PORT) readinessPort: ReadinessCheckPort) {
    this.readinessCheck = new ReadinessCheckUseCase(readinessPort);
  }

  getHealth(): HealthResponse {
    return { data: { status: 'ok' } };
  }

  async getReadiness(): Promise<ReadinessHealthResponse> {
    return { data: await this.readinessCheck.execute() };
  }
}
