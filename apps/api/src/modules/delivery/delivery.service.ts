import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AssignDeliveryDto } from './dto/assign-delivery.dto';

const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['assigned', 'failed'],
  assigned: ['picked_up', 'failed'],
  picked_up: ['en_route', 'failed'],
  en_route: ['delivered', 'failed'],
};

@Injectable()
export class DeliveryService {
  constructor(private readonly prisma: PrismaService) {}

  // ── KPIs ──────────────────────────────────────────────────────────────────

  async getKpis(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [active, pending, deliveredToday, failedToday] = await Promise.all([
      this.prisma.delivery.count({
        where: { tenantId, status: { in: ['assigned', 'picked_up', 'en_route'] } },
      }),
      this.prisma.delivery.count({ where: { tenantId, status: 'pending' } }),
      this.prisma.delivery.count({
        where: { tenantId, status: 'delivered', deliveredAt: { gte: today } },
      }),
      this.prisma.delivery.count({
        where: { tenantId, status: 'failed', assignedAt: { gte: today } },
      }),
    ]);

    return { active, pending, delivered_today: deliveredToday, failed_today: failedToday };
  }

  // ── Active deliveries ─────────────────────────────────────────────────────

  async findActive(tenantId: string) {
    const deliveries = await this.prisma.delivery.findMany({
      where: {
        tenantId,
        status: { notIn: ['delivered', 'failed'] },
      },
      orderBy: { assignedAt: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            deliveryAddress: true,
            customer: {
              select: { firstName: true, lastName: true, phone: true },
            },
          },
        },
        agent: { select: { id: true, name: true, phone: true } },
      },
    });
    return deliveries.map(this.map);
  }

  // ── Assign ────────────────────────────────────────────────────────────────

  async assign(tenantId: string, dto: AssignDeliveryDto) {
    const order = await this.prisma.order.findFirst({
      where: { id: dto.order_id, tenantId },
    });
    if (!order) throw new NotFoundException('Commande introuvable');

    const agent = await this.prisma.deliveryAgent.findFirst({
      where: { id: dto.agent_id, tenantId },
    });
    if (!agent) throw new NotFoundException('Livreur introuvable');

    const existing = await this.prisma.delivery.findUnique({
      where: { orderId: dto.order_id },
    });

    if (existing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updated = await (this.prisma as any).delivery.update({
        where: { orderId: dto.order_id },
        data: { agentId: dto.agent_id, status: 'assigned', assignedAt: new Date() },
        include: {
          order: { select: { id: true, orderNumber: true, deliveryAddress: true, customer: { select: { firstName: true, lastName: true, phone: true } } } },
          agent: { select: { id: true, name: true, phone: true } },
        },
      });
      return this.map(updated);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const delivery = await (this.prisma as any).delivery.create({
      data: {
        orderId: dto.order_id,
        tenantId,
        agentId: dto.agent_id,
        status: 'assigned',
        assignedAt: new Date(),
      },
      include: {
        order: { select: { id: true, orderNumber: true, deliveryAddress: true, customer: { select: { firstName: true, lastName: true, phone: true } } } },
        agent: { select: { id: true, name: true, phone: true } },
      },
    });
    return this.map(delivery);
  }

  // ── Auto-assign ───────────────────────────────────────────────────────────

  async autoAssign(tenantId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, tenantId } });
    if (!order) throw new NotFoundException('Commande introuvable');

    const availableAgents = await this.prisma.deliveryAgent.findMany({
      where: { tenantId, isAvailable: true },
      include: {
        _count: {
          select: {
            deliveries: { where: { status: { in: ['assigned', 'picked_up', 'en_route'] } } },
          },
        },
      },
    });

    if (availableAgents.length === 0) {
      throw new BadRequestException('Aucun livreur disponible');
    }

    availableAgents.sort((a, b) => a._count.deliveries - b._count.deliveries);
    const agent = availableAgents[0];

    return this.assign(tenantId, { order_id: orderId, agent_id: agent.id });
  }

  // ── Update status ─────────────────────────────────────────────────────────

  async updateStatus(tenantId: string, deliveryId: string, status: string, notes?: string) {
    const delivery = await this.prisma.delivery.findFirst({
      where: { id: deliveryId, tenantId },
    });
    if (!delivery) throw new NotFoundException('Livraison introuvable');

    const allowed = STATUS_TRANSITIONS[delivery.status] ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Transition invalide : ${delivery.status} → ${status}`,
      );
    }

    const timestamps: Record<string, unknown> = {};
    if (status === 'picked_up') timestamps['pickedUpAt'] = new Date();
    if (status === 'delivered') timestamps['deliveredAt'] = new Date();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = await (this.prisma as any).delivery.update({
      where: { id: deliveryId },
      data: {
        status,
        ...timestamps,
        ...(notes !== undefined && { notes }),
      },
      include: {
        order: { select: { id: true, orderNumber: true, deliveryAddress: true, customer: { select: { firstName: true, lastName: true, phone: true } } } },
        agent: { select: { id: true, name: true, phone: true } },
      },
    });
    return this.map(updated);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private map(d: any) {
    return {
      id: d.id,
      order_id: d.orderId,
      status: d.status,
      assigned_at: d.assignedAt ?? null,
      picked_up_at: d.pickedUpAt ?? null,
      delivered_at: d.deliveredAt ?? null,
      notes: d.notes ?? null,
      order: d.order
        ? {
            id: d.order.id,
            order_number: d.order.orderNumber,
            delivery_address: d.order.deliveryAddress ?? null,
            customer: d.order.customer ?? null,
          }
        : null,
      agent: d.agent ?? null,
    };
  }
}
