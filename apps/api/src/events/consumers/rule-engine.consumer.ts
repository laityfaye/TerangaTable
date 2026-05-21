import { Injectable, Logger } from '@nestjs/common';
import { RulesEvaluator } from '../../modules/rules-engine/rules.evaluator';

@Injectable()
export class RuleEngineConsumer {
  private readonly logger = new Logger(RuleEngineConsumer.name);

  constructor(private readonly evaluator: RulesEvaluator) {}

  async handleEvent(
    event: string,
    payload: Record<string, unknown>,
    tenantId: string,
  ): Promise<void> {
    this.logger.log(`Événement reçu: ${event} (tenant: ${tenantId})`);
    await this.evaluator.evaluate(event, payload, tenantId);
  }
}
