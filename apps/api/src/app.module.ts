import { Module } from '@nestjs/common';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { InventoryModule } from './inventory/presentation/inventory.module';

@Module({
  imports: [InventoryModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class AppModule {}
