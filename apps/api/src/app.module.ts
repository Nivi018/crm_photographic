import { Module } from '@nestjs/common';

import { HealthController } from './health.controller';
import { READINESS_CHECK_PORT } from './health/application/readiness-check.port';
import { PrismaReadinessCheckAdapter } from './health/infrastructure/prisma/prisma-readiness-check.adapter';
import { HealthService } from './health.service';
import { InventoryModule } from './inventory/presentation/inventory.module';

@Module({
  imports: [InventoryModule],
  controllers: [HealthController],
  providers: [
    HealthService,
    {
      provide: READINESS_CHECK_PORT,
      useClass: PrismaReadinessCheckAdapter,
    },
  ],
})
export class AppModule {}
