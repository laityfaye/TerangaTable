import { Module } from '@nestjs/common';
import { RulesEngineModule } from '../modules/rules-engine/rules-engine.module';
import { WhatsappModule } from '../modules/whatsapp/whatsapp.module';
import { ReviewsModule } from '../modules/reviews/reviews.module';
import { DeliveryModule } from '../modules/delivery/delivery.module';
import { RuleEngineConsumer } from './consumers/rule-engine.consumer';
import { ReviewRequestConsumer } from './consumers/review-request.consumer';
import { DeliveryDispatchConsumer } from './consumers/delivery-dispatch.consumer';

@Module({
  imports: [RulesEngineModule, WhatsappModule, ReviewsModule, DeliveryModule],
  providers: [RuleEngineConsumer, ReviewRequestConsumer, DeliveryDispatchConsumer],
})
export class EventsModule {}
