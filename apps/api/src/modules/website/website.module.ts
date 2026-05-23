import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { WebsiteController } from './website.controller';
import { WebsiteDashboardController } from './website-dashboard.controller';
import { WebsiteService } from './website.service';
import { StorageModule } from '../storage/storage.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    StorageModule,
    MulterModule.register({ storage: memoryStorage() }),
    OrdersModule,
  ],
  controllers: [WebsiteController, WebsiteDashboardController],
  providers: [WebsiteService],
  exports: [WebsiteService],
})
export class WebsiteModule {}
