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
      details: expect.arrayContaining([
        expect.objectContaining({ field: 'quantity' }),
        expect.objectContaining({ field: 'extra' }),
      ]),
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
    expect(document.paths).toHaveProperty('/api/inventory/categories');
    expect(document.paths).toHaveProperty('/api/inventory/articles');
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
});
