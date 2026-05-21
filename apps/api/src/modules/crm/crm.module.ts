import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { LoyaltyController } from './loyalty.controller';
import { CustomersService } from './customers.service';
import { LoyaltyService } from './loyalty.service';
import { CustomFieldsModule } from '../custom-fields/custom-fields.module';

@Module({
  imports: [CustomFieldsModule],
  controllers: [CustomersController, LoyaltyController],
  providers: [CustomersService, LoyaltyService],
  exports: [CustomersService, LoyaltyService],
})
export class CrmModule {}
