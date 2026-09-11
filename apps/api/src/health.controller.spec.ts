import 'reflect-metadata';

import { Test } from '@nestjs/testing';
import type { AddressInfo } from 'node:net';
import { describe, expect, it, vi } from 'vitest';

import { configureApplication } from './api.bootstrap';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { READINESS_CHECK_PORT } from './health/application/readiness-check.port';
import type { ReadinessCheckPort } from './health/application/readiness-check.port';

describe('HealthController', () => {
  it('returns liveness without using the database readiness port', async () => {
    const readinessPort: ReadinessCheckPort = {
      check: vi.fn().mockRejectedValue(new Error('database unavailable')),
      close: vi.fn().mockResolvedValue(undefined),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService, { provide: READINESS_CHECK_PORT, useValue: readinessPort }],
    }).compile();

    const controller = moduleRef.get(HealthController);

    expect(controller.getHealth()).toEqual({ data: { status: 'ok' } });
    expect(readinessPort.check).not.toHaveBeenCalled();

    await moduleRef.close();
  });

  it('maps readiness failures to a public 503 response without leaking the cause', async () => {
    const readinessPort: ReadinessCheckPort = {
      check: vi.fn().mockRejectedValue(new Error('postgresql://user:password@host/database')),
      close: vi.fn().mockResolvedValue(undefined),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService, { provide: READINESS_CHECK_PORT, useValue: readinessPort }],
    }).compile();
    const app = moduleRef.createNestApplication();
    configureApplication(app);
    await app.listen(0, '127.0.0.1');

    const { port } = app.getHttpServer().address() as AddressInfo;
    const liveness = await fetch(`http://127.0.0.1:${port}/health`);
    const readiness = await fetch(`http://127.0.0.1:${port}/health/ready`);

    expect(liveness.status).toBe(200);
    await expect(liveness.json()).resolves.toEqual({ data: { status: 'ok' } });
    expect(readiness.status).toBe(503);
    await expect(readiness.json()).resolves.toEqual({
      code: 'SERVICE_UNAVAILABLE',
      message: 'Database is unavailable',
      statusCode: 503,
    });

    await app.close();
    await moduleRef.close();
  });
});
