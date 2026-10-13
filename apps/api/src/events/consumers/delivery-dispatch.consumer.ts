import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DeliveryDispatchService } from '../../modules/delivery/delivery-dispatch.service';

interface OrderCreatedPayload {
  tenantId: string;
  orderId: string;
  type: string;
}

interface DeliveryRequestedPayload {
  tenantId: string;
  orderId: string;
}

@Injectable()
export class DeliveryDispatchConsumer {
  private readonly logger = new Logger(DeliveryDispatchConsumer.name);

  constructor(private readonly dispatchService: DeliveryDispatchService) {}

  /** Commandes de livraison saisies depuis le dashboard / la caisse. */
  @OnEvent('order.created')
  async onOrderCreated(payload: OrderCreatedPayload) {
    if (payload.type !== 'delivery') return;
    await this.dispatch(payload);
  }

  /** Commandes "Livraison" passées depuis le site vitrine (type "online"). */
  @OnEvent('delivery.requested')
  async onDeliveryRequested(payload: DeliveryRequestedPayload) {
    await this.dispatch(payload);
  }

  private async dispatch({ tenantId, orderId }: DeliveryRequestedPayload) {
    try {
      await this.dispatchService.dispatch(tenantId, orderId);
    } catch (err) {
      this.logger.error(`Échec diffusion livraison pour commande ${orderId}: ${(err as Error).message}`);
    }
  }
}
