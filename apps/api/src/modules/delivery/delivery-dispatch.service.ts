import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../common/mail/mail.service';

const ACTIVE_STATUSES = ['assigned', 'picked_up', 'en_route'] as const;
const OFFER_TOKEN_TTL = '12h';

interface OfferTokenPayload {
  deliveryId: string;
  agentId: string;
  purpose: 'delivery_offer';
}

/**
 * Diffusion "premier qui accepte" : à chaque commande à livrer, tous les
 * livreurs libres du restaurant reçoivent un lien personnel par email. Le
 * premier qui accepte se voit attribuer la livraison ; ensuite seul un
 * manager peut la réattribuer (POST /delivery/assign).
 */
@Injectable()
export class DeliveryDispatchService {
  private readonly logger = new Logger(DeliveryDispatchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  private get tokenSecret(): string {
    return this.config.get<string>('DELIVERY_OFFER_SECRET') ?? this.config.get<string>('JWT_SECRET')!;
  }

  // ── Diffusion ─────────────────────────────────────────────────────────────

  async dispatch(tenantId: string, orderId: string) {
    const deliveryEnabled = await this.prisma.tenantModule.findFirst({
      where: { tenantId, isActive: true, module: { slug: 'delivery' } },
      select: { id: true },
    });
    if (!deliveryEnabled) return;

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        deliveryAddress: true,
        notes: true,
        tenant: { select: { name: true } },
      },
    });
    if (!order) return;

    // Une commande n'est diffusée qu'une fois : si une livraison existe déjà
    // (diffusée ou attribuée par un manager), on ne renvoie rien.
    const existing = await this.prisma.delivery.findUnique({ where: { orderId }, select: { id: true } });
    if (existing) return;

    const delivery = await this.prisma.delivery.create({
      data: { orderId, tenantId, status: 'pending' },
      select: { id: true },
    });

    const agents = await this.prisma.deliveryAgent.findMany({
      where: {
        tenantId,
        user: { isActive: true },
        deliveries: { none: { status: { in: [...ACTIVE_STATUSES] } } },
      },
      select: { id: true, name: true, user: { select: { email: true } } },
    });

    if (agents.length === 0) {
      this.logger.warn(`Commande ${order.orderNumber} : aucun livreur libre, attribution manuelle requise`);
      return;
    }

    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
    const address = this.formatAddress(order.deliveryAddress);

    await Promise.all(
      agents.map((agent) => {
        const token = this.signOfferToken(delivery.id, agent.id);
        return this.mail.sendDeliveryOffer(agent.user.email, {
          agentName: agent.name,
          restaurantName: order.tenant.name,
          orderNumber: order.orderNumber,
          address: address ?? order.notes ?? null,
          acceptUrl: `${appUrl}/livraison/${delivery.id}?token=${token}`,
        });
      }),
    );

    this.logger.log(`Commande ${order.orderNumber} proposée à ${agents.length} livreur(s)`);
  }

  // ── Consultation / acceptation (lien public signé) ───────────────────────

  async getOffer(deliveryId: string, token: string) {
    const { agentId } = this.verifyOfferToken(token, deliveryId);
    const delivery = await this.loadDelivery(deliveryId);
    return this.mapOffer(delivery, agentId);
  }

  async acceptOffer(deliveryId: string, token: string) {
    const { agentId } = this.verifyOfferToken(token, deliveryId);
    const delivery = await this.loadDelivery(deliveryId);

    if (delivery.agentId === agentId) return this.mapOffer(delivery, agentId);
    if (delivery.order.status === 'cancelled') {
      throw new BadRequestException('Cette commande a été annulée');
    }

    const agent = await this.prisma.deliveryAgent.findFirst({
      where: { id: agentId, tenantId: delivery.tenantId, user: { isActive: true } },
      select: { id: true },
    });
    if (!agent) throw new BadRequestException('Votre compte livreur n\'est plus actif dans ce restaurant');

    const busy = await this.prisma.delivery.count({
      where: { agentId, status: { in: [...ACTIVE_STATUSES] } },
    });
    if (busy > 0) {
      throw new ConflictException('Vous avez déjà une livraison en cours — terminez-la avant d\'en accepter une autre');
    }

    // Attribution atomique : seule la première acceptation trouve encore la
    // livraison sans livreur ; les suivantes obtiennent count = 0.
    const { count } = await this.prisma.delivery.updateMany({
      where: { id: deliveryId, agentId: null, status: 'pending' },
      data: { agentId, status: 'assigned', assignedAt: new Date() },
    });
    if (count === 0) {
      throw new ConflictException('Cette livraison a déjà été acceptée par un autre livreur');
    }

    return this.mapOffer(await this.loadDelivery(deliveryId), agentId);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private signOfferToken(deliveryId: string, agentId: string): string {
    const payload: OfferTokenPayload = { deliveryId, agentId, purpose: 'delivery_offer' };
    return this.jwt.sign(payload, { secret: this.tokenSecret, expiresIn: OFFER_TOKEN_TTL });
  }

  private verifyOfferToken(token: string, deliveryId: string): OfferTokenPayload {
    let payload: OfferTokenPayload;
    try {
      payload = this.jwt.verify<OfferTokenPayload>(token, { secret: this.tokenSecret });
    } catch {
      throw new BadRequestException('Lien invalide ou expiré');
    }
    if (payload.purpose !== 'delivery_offer' || payload.deliveryId !== deliveryId) {
      throw new BadRequestException('Lien invalide');
    }
    return payload;
  }

  private async loadDelivery(deliveryId: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        tenant: { select: { name: true } },
        order: {
          select: {
            orderNumber: true,
            status: true,
            total: true,
            notes: true,
            deliveryAddress: true,
            customer: { select: { firstName: true, lastName: true, phone: true } },
            items: { select: { productName: true, quantity: true } },
          },
        },
      },
    });
    if (!delivery) throw new NotFoundException('Livraison introuvable');
    return delivery;
  }

  private mapOffer(delivery: Awaited<ReturnType<DeliveryDispatchService['loadDelivery']>>, agentId: string) {
    const mine = delivery.agentId === agentId;
    const state = delivery.order.status === 'cancelled'
      ? 'cancelled'
      : mine
        ? 'accepted'
        : delivery.agentId
          ? 'taken'
          : 'open';

    return {
      state,
      restaurant_name: delivery.tenant.name,
      order_number: delivery.order.orderNumber,
      total: delivery.order.total,
      address: this.formatAddress(delivery.order.deliveryAddress),
      notes: delivery.order.notes ?? null,
      items: delivery.order.items.map((i) => ({ name: i.productName, quantity: i.quantity })),
      // Coordonnées du client communiquées uniquement au livreur retenu
      customer: mine && delivery.order.customer
        ? {
            name: `${delivery.order.customer.firstName} ${delivery.order.customer.lastName}`.trim(),
            phone: delivery.order.customer.phone ?? null,
          }
        : null,
    };
  }

  private formatAddress(raw: unknown): string | null {
    if (!raw || typeof raw !== 'object') return null;
    const a = raw as { street?: string; city?: string };
    return [a.street, a.city].filter(Boolean).join(', ') || null;
  }
}
