import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { ReviewsService } from '../../modules/reviews/reviews.service';
import { TwilioClientService } from '../../modules/whatsapp/services/twilio-client.service';

interface OrderStateChangedPayload {
  tenantId: string;
  orderId: string;
  toState: string | null;
}

@Injectable()
export class ReviewRequestConsumer {
  private readonly logger = new Logger(ReviewRequestConsumer.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reviewsService: ReviewsService,
    private readonly twilio: TwilioClientService,
    private readonly config: ConfigService,
  ) {}

  @OnEvent('order.state_changed')
  async onOrderStateChanged(payload: OrderStateChangedPayload) {
    try {
      await this.handle(payload);
    } catch (err) {
      this.logger.error(`Échec envoi demande d'avis pour commande ${payload.orderId}: ${(err as Error).message}`);
    }
  }

  private async handle({ tenantId, orderId, toState }: OrderStateChangedPayload) {
    if (!toState) return;

    const state = await this.prisma.workflowState.findUnique({
      where: { id: toState },
      select: { isTerminal: true, slug: true },
    });
    const isTerminal = state?.isTerminal || (state?.slug && ['served', 'delivered'].includes(state.slug));
    if (!isTerminal) return;

    const reviewsEnabled = await this.prisma.tenantModule.findFirst({
      where: { tenantId, isActive: true, module: { slug: 'reviews' } },
    });
    if (!reviewsEnabled) return;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, customer: { select: { phone: true } } },
    });
    const phone = order?.customer?.phone;
    if (!phone) return;

    const token = this.reviewsService.signReviewToken(orderId);
    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
    const link = `${appUrl}/avis/${orderId}?token=${token}`;

    await this.twilio.sendMessage(
      phone,
      `Merci pour votre commande ! Prenez 30 secondes pour la noter : ${link}`,
    );
  }
}
