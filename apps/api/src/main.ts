import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { configureApplication, setupSwagger } from './api.bootstrap';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  configureApplication(app);
  setupSwagger(app);
  await app.listen(process.env.PORT ?? 3002);
}

void bootstrap();
