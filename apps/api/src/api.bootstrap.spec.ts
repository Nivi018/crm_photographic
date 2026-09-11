import 'reflect-metadata';

import { Body, Controller, Get, Post } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { IsInt } from 'class-validator';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';

import { configureApplication, createSwaggerDocument } from './api.bootstrap';
import { AppModule } from './app.module';
import { CategoryNotFoundError } from './inventory/application/categories/category.service';
import { ArticleNotFoundError } from './inventory/application/articles/article.service';
import {
  ArticleNameConflictError,
  NegativeStockConfirmationRequiredError,
} from './inventory/application/articles/article.service';

class ValidationProbeDto {
  @IsInt()
  quantity!: number;
}

@Controller('validation-probe')
class ValidationProbeController {
  @Post()
  create(@Body() body: ValidationProbeDto): ValidationProbeDto {
    return body;
  }

  @Get('category-error')
  categoryError(): never {
    throw new CategoryNotFoundError();
  }

  @Get('article-error')
  articleError(): never {
    throw new ArticleNotFoundError();
  }

  @Get('negative-stock-error')
  negativeStockError(): never {
    throw new NegativeStockConfirmationRequiredError(-2);
  }

  @Get('conflict-error')
  conflictError(): never {
    throw new ArticleNameConflictError();
  }

  @Get('unexpected-error')
  unexpectedError(): never {
    throw new Error('postgresql://user:password@localhost:5432/inventory');
  }
}

describe('API bootstrap', () => {
  let moduleRef: TestingModule | undefined;

  afterEach(async () => {
    await moduleRef?.close();
  });

  it('validates requests globally and returns a typed validation error', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [ValidationProbeController],
    }).compile();
    const app = moduleRef.createNestApplication();
    configureApplication(app);
    await app.listen(0, '127.0.0.1');

    const { port } = app.getHttpServer().address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${port}/validation-probe`, {
      body: JSON.stringify({ extra: true }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: {
        fields: expect.arrayContaining([
          expect.objectContaining({ field: 'quantity' }),
          expect.objectContaining({ field: 'extra' }),
        ]),
      },
      message: 'Request validation failed',
      statusCode: 400,
    });
  });

  it('generates an OpenAPI document for the API', async () => {
    moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    configureApplication(app);
    await app.init();

    const document = createSwaggerDocument(app);

    expect(document.info).toMatchObject({ title: 'CRM Photography API', version: '0.1.0' });
    expect(document.paths).toHaveProperty('/health');
    expect(document.paths).toHaveProperty('/health/ready');
    expect(document.paths['/health']?.get?.responses).toMatchObject({ 200: expect.any(Object) });
    expect(document.paths['/health/ready']?.get?.responses).toMatchObject({
      200: expect.any(Object),
      503: expect.any(Object),
    });
    expect(document.paths).toHaveProperty('/api/inventory/categories');
    expect(document.paths).toHaveProperty('/api/inventory/articles');
    expect(document.paths).toHaveProperty('/api/inventory/movements');
    expect(document.paths).toHaveProperty('/api/inventory/articles/{id}/movements');
    expect(document.paths).toHaveProperty('/api/inventory/articles/{id}/movements/entries');
    expect(document.paths).toHaveProperty('/api/inventory/articles/{id}/deactivate');
    expect(document.paths).toHaveProperty('/api/inventory/categories/{id}/reactivate');
    expect(document.paths['/api/inventory/articles']?.post?.responses).toMatchObject({
      201: expect.any(Object),
      400: expect.any(Object),
      404: expect.any(Object),
      409: expect.any(Object),
      500: expect.any(Object),
    });
    expect(document.paths['/api/inventory/articles/{id}']?.get?.responses).toMatchObject({
      200: expect.any(Object),
      400: expect.any(Object),
      404: expect.any(Object),
      500: expect.any(Object),
    });
    expect(
      document.paths['/api/inventory/articles/{id}/movements/exits']?.post?.responses,
    ).toMatchObject({
      201: expect.any(Object),
      400: expect.any(Object),
      404: expect.any(Object),
      409: expect.any(Object),
      500: expect.any(Object),
    });
    expect(document.components?.schemas?.ArticleResponseEnvelopeDto).toMatchObject({
      properties: { data: { $ref: '#/components/schemas/ArticlePublicDto' } },
    });
    expect(document.components?.schemas?.NegativeStockConfirmationErrorResponseDto).toBeDefined();
  });

  it('maps category domain errors to the typed HTTP envelope', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [ValidationProbeController],
    }).compile();
    const app = moduleRef.createNestApplication();
    configureApplication(app);
    await app.listen(0, '127.0.0.1');

    const { port } = app.getHttpServer().address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${port}/validation-probe/category-error`);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      code: 'NOT_FOUND',
      message: 'category was not found',
      statusCode: 404,
    });
  });

  it('maps article domain errors to the typed HTTP envelope', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [ValidationProbeController],
    }).compile();
    const app = moduleRef.createNestApplication();
    configureApplication(app);
    await app.listen(0, '127.0.0.1');

    const { port } = app.getHttpServer().address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${port}/validation-probe/article-error`);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ code: 'NOT_FOUND', statusCode: 404 });
  });

  it('maps classified errors to their exact HTTP statuses and details', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [ValidationProbeController],
    }).compile();
    const app = moduleRef.createNestApplication();
    configureApplication(app);
    await app.listen(0, '127.0.0.1');

    const { port } = app.getHttpServer().address() as AddressInfo;
    const negative = await fetch(`http://127.0.0.1:${port}/validation-probe/negative-stock-error`);
    const conflict = await fetch(`http://127.0.0.1:${port}/validation-probe/conflict-error`);

    expect(negative.status).toBe(400);
    await expect(negative.json()).resolves.toEqual({
      code: 'NEGATIVE_STOCK_CONFIRMATION_REQUIRED',
      details: { stockAfter: -2 },
      message: 'editing initial stock would produce negative stock',
      statusCode: 400,
    });
    expect(conflict.status).toBe(409);
    await expect(conflict.json()).resolves.toMatchObject({
      code: 'NAME_CONFLICT',
      statusCode: 409,
    });
  });

  it('hides unexpected error details behind INTERNAL_ERROR', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [ValidationProbeController],
    }).compile();
    const app = moduleRef.createNestApplication();
    configureApplication(app);
    await app.listen(0, '127.0.0.1');

    const { port } = app.getHttpServer().address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${port}/validation-probe/unexpected-error`);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      statusCode: 500,
    });
  });
});
