import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { WebsiteController } from './website.controller';
import { WebsiteDashboardController } from './website-dashboard.controller';
import { WebsiteService } from './website.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    StorageModule,
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [WebsiteController, WebsiteDashboardController],
  providers: [WebsiteService],
  exports: [WebsiteService],
})
export class WebsiteModule {}
