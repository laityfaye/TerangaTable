import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RulesEvaluator } from '../../modules/rules-engine/rules.evaluator';

interface DomainEventPayload extends Record<string, unknown> {
  tenantId: string;
}

@Injectable()
export class RuleEngineConsumer {
  private readonly logger = new Logger(RuleEngineConsumer.name);

  constructor(private readonly evaluator: RulesEvaluator) {}

  @OnEvent('order.created')
  onOrderCreated(payload: DomainEventPayload) {
    return this.handleEvent('order.created', payload);
  }

  @OnEvent('order.state_changed')
  onOrderStateChanged(payload: DomainEventPayload) {
    return this.handleEvent('order.state_changed', payload);
  }

  @OnEvent('payment.received')
  onPaymentReceived(payload: DomainEventPayload) {
    return this.handleEvent('payment.received', payload);
  }

  @OnEvent('payment.refunded')
  onPaymentRefunded(payload: DomainEventPayload) {
    return this.handleEvent('payment.refunded', payload);
  }

  @OnEvent('reservation.created')
  onReservationCreated(payload: DomainEventPayload) {
    return this.handleEvent('reservation.created', payload);
  }

  @OnEvent('reservation.updated')
  onReservationUpdated(payload: DomainEventPayload) {
    return this.handleEvent('reservation.updated', payload);
  }

  @OnEvent('reservation.cancelled')
  onReservationCancelled(payload: DomainEventPayload) {
    return this.handleEvent('reservation.cancelled', payload);
  }

  @OnEvent('reservation.reminder_j1')
  onReservationReminderJ1(payload: DomainEventPayload) {
    return this.handleEvent('reservation.reminder_j1', payload);
  }

  @OnEvent('reservation.reminder_h2')
  onReservationReminderH2(payload: DomainEventPayload) {
    return this.handleEvent('reservation.reminder_h2', payload);
  }

  async handleEvent(event: string, payload: DomainEventPayload): Promise<void> {
    if (!payload?.tenantId) {
      this.logger.warn(`Événement "${event}" reçu sans tenantId, ignoré`);
      return;
    }
    this.logger.log(`Événement reçu: ${event} (tenant: ${payload.tenantId})`);
    await this.evaluator.evaluate(event, payload, payload.tenantId);
  }
}
