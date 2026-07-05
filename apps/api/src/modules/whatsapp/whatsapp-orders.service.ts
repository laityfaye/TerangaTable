import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CustomersService } from '../crm/customers.service';
import { OrdersGateway } from '../orders/orders.gateway';
import { OrderPublisher } from '../../events/publishers/order.publisher';

export interface DraftCartItem {
  productId: string;
  quantity: number;
  optionIds: string[];
  notes?: string;
}

interface ResolvedLine {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  notes: string | null;
  options: { groupId: string; groupName: string; optionId: string; optionName: string; priceDelta: number }[];
}

/**
 * Crée des commandes à partir d'une conversation WhatsApp. Modélisé sur
 * WebsiteService.createPublicOrder mais corrige ses 2 lacunes : lien vers un
 * vrai Customer (via CustomersService.findOrCreateByPhone) et publication de
 * order.created (pas seulement emitOrderCreated) pour que le rules engine se
 * déclenche. Ne fait jamais confiance au panier en cache : les produits/prix
 * sont revalidés à chaque appel.
 */
@Injectable()
export class WhatsappOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customersService: CustomersService,
    private readonly ordersGateway: OrdersGateway,
    private readonly publisher: OrderPublisher,
  ) {}

  /**
   * Résout le panier en cours contre les données produit/option actuelles.
   * Utilisé à la fois par view_cart (affichage) et place_order (avant création).
   * Lève une BadRequestException listant les articles invalides le cas échéant.
   */
  async resolveCart(tenantId: string, cart: DraftCartItem[]): Promise<{ lines: ResolvedLine[]; subtotal: number }> {
    if (cart.length === 0) return { lines: [], subtotal: 0 };

    const productIds = cart.map((i) => i.productId);
    const optionIds = cart.flatMap((i) => i.optionIds);

    // Prisma gère `in: []` sans souci (retourne []) — pas besoin de court-circuiter
    // la requête quand optionIds est vide, ce qui évite une union de types ambiguë.
    const [products, options] = await Promise.all([
      this.prisma.product.findMany({
        where: { id: { in: productIds }, tenantId },
        select: { id: true, name: true, basePrice: true, isAvailable: true },
      }),
      this.prisma.productOption.findMany({
        where: { id: { in: optionIds }, tenantId },
        select: { id: true, name: true, priceDelta: true, isAvailable: true, groupId: true, group: { select: { name: true } } },
      }),
    ]);

    const productMap = new Map(products.map((p) => [p.id, p]));
    const optionMap = new Map(options.map((o) => [o.id, o]));

    const unavailable: string[] = [];
    const lines: ResolvedLine[] = cart.map((item) => {
      const product = productMap.get(item.productId);
      if (!product || !product.isAvailable) {
        unavailable.push(item.productId);
        return null as unknown as ResolvedLine;
      }

      const resolvedOptions = item.optionIds
        .map((id) => optionMap.get(id))
        .filter((o): o is NonNullable<typeof o> => !!o && o.isAvailable)
        .map((o) => ({
          groupId: o.groupId,
          groupName: o.group.name,
          optionId: o.id,
          optionName: o.name,
          priceDelta: Number(o.priceDelta),
        }));

      const optDelta = resolvedOptions.reduce((s, o) => s + o.priceDelta, 0);
      const unitPrice = Number(product.basePrice) + optDelta;
      const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;

      return {
        productId: product.id,
        productName: product.name,
        unitPrice: Math.round(unitPrice * 100) / 100,
        quantity: item.quantity,
        lineTotal,
        notes: item.notes ?? null,
        options: resolvedOptions,
      };
    }).filter((l): l is ResolvedLine => l !== null);

    if (unavailable.length > 0) {
      throw new BadRequestException(`Produits indisponibles ou introuvables : ${unavailable.join(', ')}`);
    }

    const subtotal = Math.round(lines.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100;
    return { lines, subtotal };
  }

  async createOrderFromConversation(
    tenantId: string,
    phone: string,
    cart: DraftCartItem[],
    customerName?: string,
    notes?: string,
  ): Promise<{ orderNumber: string; total: number }> {
    if (cart.length === 0) {
      throw new BadRequestException('Le panier est vide');
    }

    const workflow = await this.prisma.workflowDefinition.findFirst({
      where: { tenantId, entityType: 'order', isDefault: true },
      include: { states: { where: { isInitial: true }, take: 1 } },
    });
    if (!workflow || workflow.states.length === 0) {
      throw new BadRequestException('Aucun workflow par défaut configuré pour les commandes');
    }
    const initialStateId = workflow.states[0].id;

    const { lines, subtotal } = await this.resolveCart(tenantId, cart);
    const customer = await this.customersService.findOrCreateByPhone(tenantId, phone, customerName);

    const order = await this.prisma.$transaction(async (tx) => {
      const year = new Date().getFullYear();
      const prefix = `ORD-${year}-`;

      const lastOrder = await tx.order.findFirst({
        where: { tenantId, orderNumber: { startsWith: prefix } },
        orderBy: { orderNumber: 'desc' },
        select: { orderNumber: true },
      });

      let seq = 1;
      if (lastOrder) {
        const lastSeq = parseInt(lastOrder.orderNumber.split('-')[2] ?? '', 10);
        if (!isNaN(lastSeq)) seq = lastSeq + 1;
      }
      const orderNumber = `${prefix}${String(seq).padStart(4, '0')}`;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (tx as any).order.create({
        data: {
          tenantId,
          orderNumber,
          type: 'takeaway',
          workflowStateId: initialStateId,
          customerId: customer.id,
          agentId: null,
          subtotal: subtotal.toString(),
          discountAmount: '0',
          total: subtotal.toString(),
          notes: notes ?? `Commande passée via WhatsApp (${phone})`,
          items: {
            create: lines.map((l) => ({
              tenantId,
              productId: l.productId,
              productName: l.productName,
              unitPrice: l.unitPrice.toString(),
              quantity: l.quantity,
              options: l.options as object[],
              lineTotal: l.lineTotal.toString(),
              notes: l.notes,
            })),
          },
        },
        include: {
          workflowState: { select: { id: true, name: true, color: true, slug: true } },
          customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
          items: true,
        },
      });
    });

    // Corrige les 2 lacunes de WebsiteService.createPublicOrder : vraie
    // publication d'événement (rules engine) + notif temps réel dashboard.
    await this.publisher.publish('order.created', {
      tenantId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      type: order.type,
      total: order.total,
      createdAt: order.createdAt,
    });

    this.ordersGateway.emitOrderCreated(tenantId, {
      id: order.id,
      order_number: order.orderNumber,
      type: order.type,
      workflow_state: order.workflowState ?? null,
      customer: order.customer ?? null,
      agent: null,
      subtotal: order.subtotal,
      discount_amount: order.discountAmount,
      total: order.total,
      notes: order.notes ?? null,
      created_at: order.createdAt,
      items: order.items ?? [],
      payments: [],
    });

    return { orderNumber: order.orderNumber, total: Number(order.total) };
  }

  async getLatestOrderStatus(tenantId: string, phone: string, orderNumber?: string) {
    const customer = await this.prisma.customer.findFirst({ where: { tenantId, phone } });
    if (!customer) return null;

    const order = await this.prisma.order.findFirst({
      where: { tenantId, customerId: customer.id, ...(orderNumber ? { orderNumber } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { workflowState: { select: { name: true, slug: true } } },
    });
    if (!order) return null;

    return {
      orderNumber: order.orderNumber,
      status: order.workflowState?.name ?? order.workflowState?.slug ?? 'inconnu',
      total: Number(order.total),
      createdAt: order.createdAt,
    };
  }
}
