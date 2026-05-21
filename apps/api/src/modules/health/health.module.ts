import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisCacheModule } from '../../common/redis-cache.module';

@Module({
  imports: [PrismaModule, RedisCacheModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
