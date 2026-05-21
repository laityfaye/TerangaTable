import { Module } from '@nestjs/common';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { OptionsModule } from './options/options.module';

@Module({
  imports: [CategoriesModule, ProductsModule, OptionsModule],
  exports: [CategoriesModule, ProductsModule, OptionsModule],
})
export class MenuModule {}
