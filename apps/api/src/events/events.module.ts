import { Module } from '@nestjs/common';
import { RulesEngineModule } from '../modules/rules-engine/rules-engine.module';
import { WhatsappModule } from '../modules/whatsapp/whatsapp.module';
import { ReviewsModule } from '../modules/reviews/reviews.module';
import { RuleEngineConsumer } from './consumers/rule-engine.consumer';
import { ReviewRequestConsumer } from './consumers/review-request.consumer';

@Module({
  imports: [RulesEngineModule, WhatsappModule, ReviewsModule],
  providers: [RuleEngineConsumer, ReviewRequestConsumer],
})
export class EventsModule {}
