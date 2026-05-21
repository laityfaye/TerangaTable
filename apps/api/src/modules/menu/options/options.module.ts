import { Module } from '@nestjs/common';
import { OptionsService } from './options.service';
import { ProductOptionGroupsController } from './product-option-groups.controller';
import { OptionGroupOptionsController } from './option-group-options.controller';

@Module({
  controllers: [ProductOptionGroupsController, OptionGroupOptionsController],
  providers: [OptionsService],
  exports: [OptionsService],
})
export class OptionsModule {}
