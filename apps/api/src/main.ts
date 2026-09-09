import 'reflect-metadata';

import { config } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { resolve } from 'node:path';

import { configureApplication, setupSwagger } from './api.bootstrap';
import { AppModule } from './app.module';

// The root dev script keeps its working directory at the monorepo root.
config({ path: resolve(process.cwd(), 'apps/api/.env') });
config();

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  configureApplication(app);
  setupSwagger(app);
  await app.listen(process.env.PORT ?? 3002);
}

void bootstrap();
