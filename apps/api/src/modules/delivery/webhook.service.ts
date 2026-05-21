import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Glovo ─────────────────────────────────────────────────────────────────

  async handleGlovo(tenantId: string, payload: Record<string, unknown>) {
    this.logger.log(`Glovo webhook received for tenant ${tenantId}`);

    const parsed = this.parseGlovoPayload(payload);
    const order = await this.createExternalOrder(tenantId, parsed, 'glovo');

    return { received: true, order_id: order?.id ?? null };
  }

  // ── Uber Eats ─────────────────────────────────────────────────────────────

  async handleUberEats(tenantId: string, payload: Record<string, unknown>) {
    this.logger.log(`Uber Eats webhook received for tenant ${tenantId}`);

    const parsed = this.parseUberEatsPayload(payload);
    const order = await this.createExternalOrder(tenantId, parsed, 'ubereats');

    return { received: true, order_id: order?.id ?? null };
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  private parseGlovoPayload(payload: Record<string, unknown>) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = payload as any;
    return {
      externalId: String(p?.order_id ?? p?.id ?? ''),
      customerName: String(p?.customer?.name ?? 'Client Glovo'),
      customerPhone: String(p?.customer?.phone_number ?? ''),
      deliveryAddress: {
        street: p?.delivery_address?.label ?? p?.delivery_address?.street ?? '',
        city: p?.delivery_address?.city ?? '',
        coordinates: p?.delivery_address?.coordinates ?? null,
      },
      items: this.normalizeItems(p?.products ?? p?.items ?? []),
      total: parseFloat(String(p?.total_price ?? p?.order_price ?? 0)),
    };
  }

  private parseUberEatsPayload(payload: Record<string, unknown>) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = payload as any;
    return {
      externalId: String(p?.id ?? ''),
      customerName: String(
        p?.eater?.first_name
          ? `${p.eater.first_name} ${p.eater.last_name ?? ''}`.trim()
          : 'Client Uber Eats',
      ),
      customerPhone: String(p?.eater?.phone ?? ''),
      deliveryAddress: {
        street: p?.delivery?.location?.address ?? '',
        city: '',
        coordinates: p?.delivery?.location?.latitude
          ? { lat: p.delivery.location.latitude, lng: p.delivery.location.longitude }
          : null,
      },
      items: this.normalizeItems(p?.cart?.items ?? []),
      total: parseFloat(String(p?.payment?.charges?.total?.amount ?? 0)) / 100,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private normalizeItems(raw: any[]): Array<{ name: string; quantity: number; price: number }> {
    if (!Array.isArray(raw)) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return raw.map((item: any) => ({
      name: String(item.name ?? item.title ?? item.product_name ?? 'Article'),
      quantity: parseInt(String(item.quantity ?? item.qty ?? 1), 10),
      price: parseFloat(String(item.price ?? item.unit_price ?? item.total_price ?? 0)),
    }));
  }

  private async createExternalOrder(
    tenantId: string,
    parsed: ReturnType<typeof this.parseGlovoPayload>,
    source: string,
  ) {
    try {
      const workflow = await this.prisma.workflowDefinition.findFirst({
        where: { tenantId, entityType: 'order', isDefault: true },
        include: { states: { where: { isInitial: true }, take: 1 } },
      });

      if (!workflow || workflow.states.length === 0) {
        this.logger.warn(`No default order workflow for tenant ${tenantId}`);
        return null;
      }

      const initialStateId = workflow.states[0].id;
      const year = new Date().getFullYear();
      const prefix = `ORD-${year}-`;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lastOrder = await (this.prisma as any).order.findFirst({
        where: { tenantId, orderNumber: { startsWith: prefix } },
        orderBy: { orderNumber: 'desc' },
        select: { orderNumber: true },
      });

      let seq = 1;
      if (lastOrder) {
        const lastSeq = parseInt(lastOrder.orderNumber.split('-')[2], 10);
        if (!isNaN(lastSeq)) seq = lastSeq + 1;
      }

      const orderNumber = `${prefix}${String(seq).padStart(4, '0')}`;

      const subtotal = parsed.items.reduce(
        (sum, i) => parseFloat((sum + i.price * i.quantity).toFixed(2)),
        0,
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const order = await (this.prisma as any).order.create({
        data: {
          tenantId,
          orderNumber,
          type: 'delivery',
          workflowStateId: initialStateId,
          subtotal: subtotal.toString(),
          total: subtotal.toString(),
          deliveryAddress: parsed.deliveryAddress,
          notes: `Commande ${source} — réf: ${parsed.externalId}`,
          items: {
            create: parsed.items.map((item) => ({
              tenantId,
              productName: item.name,
              quantity: item.quantity,
              unitPrice: item.price.toString(),
              lineTotal: (item.price * item.quantity).toFixed(2),
              options: [],
            })),
          },
        },
        select: { id: true, orderNumber: true },
      });

      this.logger.log(`Created order ${order.orderNumber} from ${source}`);
      return order;
    } catch (err) {
      this.logger.error(`Failed to create order from ${source} webhook`, err);
      return null;
    }
  }
}
