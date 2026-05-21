import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { CustomFieldsModule } from '../../custom-fields/custom-fields.module';
import { StorageModule } from '../../storage/storage.module';

@Module({
  imports: [CustomFieldsModule, StorageModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
