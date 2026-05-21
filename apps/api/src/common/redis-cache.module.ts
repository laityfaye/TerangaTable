import { Global, Module } from '@nestjs/common';
import { RedisCacheService } from './services/redis-cache.service';

@Global()
@Module({
  providers: [RedisCacheService],
  exports: [RedisCacheService],
})
export class RedisCacheModule {}
