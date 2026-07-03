import { Module } from '@nestjs/common';
import { RulesEngineModule } from '../modules/rules-engine/rules-engine.module';
import { RuleEngineConsumer } from './consumers/rule-engine.consumer';

@Module({
  imports: [RulesEngineModule],
  providers: [RuleEngineConsumer],
})
export class EventsModule {}
