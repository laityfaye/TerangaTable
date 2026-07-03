import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentPublisher } from '../../events/publishers/payment.publisher';
import { CrmModule } from '../crm/crm.module';

@Module({
  imports:     [CrmModule],
  controllers: [PaymentsController],
  providers:   [PaymentsService, PaymentPublisher],
  exports:     [PaymentsService],
})
export class PaymentsModule {}
