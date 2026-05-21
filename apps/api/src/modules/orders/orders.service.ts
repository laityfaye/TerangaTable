import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkflowEngine } from '../workflows/workflow.engine';
import { OrderPublisher } from '../../events/publishers/order.publisher';
import { CreateOrderDto, CreateOrderItemDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { ListOrdersDto } from './dto/list-orders.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workflowEngine: WorkflowEngine,
    private readonly publisher: OrderPublisher,
  ) {}

  // ── List ──────────────────────────────────────────────────────────────────

  async findAll(tenantId: string, query: ListOrdersDto) {
    const { page = 1, limit = 50, status, type, date_from, date_to, search } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId };
    if (status) where['workflowState'] = { slug: status };
    if (type) where['type'] = type;
    if (date_from || date_to) {
      where['createdAt'] = {
        ...(date_from && { gte: new Date(date_from) }),
        ...(date_to && { lte: new Date(date_to) }),
      };
    }
    if (search) where['orderNumber'] = { contains: search, mode: 'insensitive' as const };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          workflowState: { select: { id: true, name: true, color: true, slug: true } },
          customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
          agent: { select: { id: true, firstName: true, lastName: true } },
          table: { select: { id: true, number: true } },
          items: {
            select: {
              id: true,
              productName: true,
              quantity: true,
              unitPrice: true,
              lineTotal: true,
              options: true,
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders.map((o) => this.mapOrder(o)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Find One ──────────────────────────────────────────────────────────────

  async findOne(tenantId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, tenantId },
      include: {
        workflowState: { select: { id: true, name: true, color: true, slug: true, sortOrder: true } },
        customer: {
          select: { id: true, firstName: true, lastName: true, phone: true, email: true },
        },
        agent: { select: { id: true, firstName: true, lastName: true } },
        table: { select: { id: true, number: true } },
        items: {
          select: {
            id: true,
            productId: true,
            productName: true,
            unitPrice: true,
            quantity: true,
            options: true,
            lineTotal: true,
            notes: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        payments: {
          select: {
            id: true,
            method: true,
            amount: true,
            status: true,
            reference: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) throw new NotFoundException('Commande introuvable');
    return this.mapOrder(order);
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async create(tenantId: string, userId: string, dto: CreateOrderDto) {
    const workflow = await this.prisma.workflowDefinition.findFirst({
      where: { tenantId, entityType: 'order', isDefault: true },
      include: { states: { where: { isInitial: true }, take: 1 } },
    });

    if (!workflow || workflow.states.length === 0) {
      throw new BadRequestException(
        'Aucun workflow par défaut configuré pour les commandes',
      );
    }

    const initialStateId = workflow.states[0].id;

    const products = await this.prisma.product.findMany({
      where: { id: { in: dto.items.map((i) => i.product_id) }, tenantId },
      select: { id: true, name: true, basePrice: true, isAvailable: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of dto.items) {
      const product = productMap.get(item.product_id);
      if (!product) throw new NotFoundException(`Produit introuvable : ${item.product_id}`);
      if (!product.isAvailable) throw new BadRequestException(`Produit indisponible : ${product.name}`);
    }

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
        const lastSeq = parseInt(lastOrder.orderNumber.split('-')[2], 10);
        if (!isNaN(lastSeq)) seq = lastSeq + 1;
      }

      const orderNumber = `${prefix}${String(seq).padStart(4, '0')}`;

      let subtotal = 0;
      const itemsData = dto.items.map((item) => {
        const product = productMap.get(item.product_id)!;
        const base = parseFloat(product.basePrice.toString());
        const optDelta = (item.options ?? []).reduce((s, o) => s + Number(o.price_delta), 0);
        const unitPrice = parseFloat((base + optDelta).toFixed(2));
        const lineTotal = parseFloat((unitPrice * item.quantity).toFixed(2));
        subtotal = parseFloat((subtotal + lineTotal).toFixed(2));

        return {
          tenantId,
          productId: item.product_id,
          productName: product.name,
          unitPrice: unitPrice.toString(),
          quantity: item.quantity,
          options: (item.options ?? []) as object[],
          lineTotal: lineTotal.toString(),
          notes: item.notes ?? null,
        };
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (tx as any).order.create({
        data: {
          tenantId,
          orderNumber,
          type: dto.type,
          workflowStateId: initialStateId,
          tableId: dto.table_id ?? null,
          customerId: dto.customer_id ?? null,
          agentId: userId,
          subtotal: subtotal.toString(),
          total: subtotal.toString(),
          notes: dto.notes ?? null,
          deliveryAddress: (dto.delivery_address as object) ?? null,
          items: { create: itemsData },
        },
        include: {
          workflowState: { select: { id: true, name: true, color: true, slug: true } },
          customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
          agent: { select: { id: true, firstName: true, lastName: true } },
          table: { select: { id: true, number: true } },
          items: true,
        },
      });
    });

    const mapped = this.mapOrder(order);

    await this.publisher.publish('order.created', {
      tenantId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      type: order.type,
      total: order.total,
      createdAt: order.createdAt,
    });

    return mapped;
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async update(tenantId: string, id: string, dto: UpdateOrderDto) {
    await this.ensureExists(tenantId, id);

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.delivery_address !== undefined && {
          deliveryAddress: dto.delivery_address as object,
        }),
      },
      include: {
        workflowState: { select: { id: true, name: true, color: true, slug: true } },
        customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
        table: { select: { id: true, number: true } },
        items: true,
      },
    });

    return this.mapOrder(updated);
  }

  // ── Cancel ────────────────────────────────────────────────────────────────

  async cancel(tenantId: string, id: string, userId: string) {
    const order = await this.ensureExists(tenantId, id);

    const cancelState = await this.prisma.workflowState.findFirst({
      where: {
        tenantId,
        isTerminal: true,
        name: { contains: 'annul', mode: 'insensitive' as const },
      },
    });

    await this.prisma.order.update({
      where: { id },
      data: {
        status: 'cancelled',
        ...(cancelState && { workflowStateId: cancelState.id }),
      },
    });

    await this.publisher.publish('order.state_changed', {
      tenantId,
      orderId: id,
      fromState: order.workflowStateId,
      toState: cancelState?.id ?? 'cancelled',
      changedBy: userId,
      changedAt: new Date(),
    });

    return { cancelled: true, workflowStateId: cancelState?.id ?? null };
  }

  // ── Transition ────────────────────────────────────────────────────────────

  async transition(tenantId: string, orderId: string, transitionId: string, userId: string) {
    await this.ensureExists(tenantId, orderId);

    const result = await this.workflowEngine.executeTransition(
      orderId,
      transitionId,
      userId,
      tenantId,
    );

    const newState = await this.prisma.workflowState.findUnique({
      where: { id: result.newStateId },
      select: { id: true, name: true, color: true, slug: true },
    });

    await this.publisher.publish('order.state_changed', {
      tenantId,
      orderId,
      fromState: null,
      toState: result.newStateId,
      changedBy: userId,
      changedAt: new Date(),
    });

    return { ...result, workflowState: newState };
  }

  // ── Available Transitions ─────────────────────────────────────────────────

  async getAvailableTransitions(tenantId: string, orderId: string, userId: string) {
    return this.workflowEngine.getAvailableTransitions(orderId, userId, tenantId);
  }

  // ── Items ─────────────────────────────────────────────────────────────────

  async addItem(tenantId: string, orderId: string, dto: CreateOrderItemDto) {
    await this.ensureExists(tenantId, orderId);

    const product = await this.prisma.product.findFirst({
      where: { id: dto.product_id, tenantId },
      select: { id: true, name: true, basePrice: true, isAvailable: true },
    });

    if (!product) throw new NotFoundException('Produit introuvable');
    if (!product.isAvailable) throw new BadRequestException('Produit indisponible');

    const base = parseFloat(product.basePrice.toString());
    const optDelta = (dto.options ?? []).reduce((s, o) => s + Number(o.price_delta), 0);
    const unitPrice = parseFloat((base + optDelta).toFixed(2));
    const lineTotal = parseFloat((unitPrice * dto.quantity).toFixed(2));

    return this.prisma.$transaction(async (tx) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const item = await (tx as any).orderItem.create({
        data: {
          tenantId,
          orderId,
          productId: dto.product_id,
          productName: product.name,
          unitPrice: unitPrice.toString(),
          quantity: dto.quantity,
          options: (dto.options ?? []) as object[],
          lineTotal: lineTotal.toString(),
          notes: dto.notes ?? null,
        },
      });

      await this.recalcTotal(tx, orderId);
      return item;
    });
  }

  async updateItem(tenantId: string, orderId: string, itemId: string, dto: UpdateOrderItemDto) {
    await this.ensureExists(tenantId, orderId);

    const item = await this.prisma.orderItem.findFirst({
      where: { id: itemId, orderId, tenantId },
    });
    if (!item) throw new NotFoundException('Ligne introuvable');

    return this.prisma.$transaction(async (tx) => {
      const quantity = dto.quantity ?? item.quantity;
      const unitPrice = parseFloat(item.unitPrice.toString());
      const lineTotal = parseFloat((unitPrice * quantity).toFixed(2));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updated = await (tx as any).orderItem.update({
        where: { id: itemId },
        data: {
          quantity,
          lineTotal: lineTotal.toString(),
          ...(dto.options !== undefined && { options: dto.options as object[] }),
          ...(dto.notes !== undefined && { notes: dto.notes }),
        },
      });

      await this.recalcTotal(tx, orderId);
      return updated;
    });
  }

  async removeItem(tenantId: string, orderId: string, itemId: string) {
    await this.ensureExists(tenantId, orderId);

    const item = await this.prisma.orderItem.findFirst({
      where: { id: itemId, orderId, tenantId },
    });
    if (!item) throw new NotFoundException('Ligne introuvable');

    return this.prisma.$transaction(async (tx) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tx as any).orderItem.delete({ where: { id: itemId } });
      await this.recalcTotal(tx, orderId);
      return { deleted: true };
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async recalcTotal(tx: any, orderId: string) {
    const items = await tx.orderItem.findMany({
      where: { orderId },
      select: { lineTotal: true },
    });
    const subtotal = items.reduce(
      (sum: number, i: { lineTotal: unknown }) =>
        parseFloat((sum + parseFloat(String(i.lineTotal))).toFixed(2)),
      0,
    );
    await tx.order.update({
      where: { id: orderId },
      data: { subtotal: subtotal.toString(), total: subtotal.toString() },
    });
  }

  private async ensureExists(tenantId: string, id: string) {
    const order = await this.prisma.order.findFirst({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('Commande introuvable');
    return order;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapOrder(order: any) {
    return {
      id: order.id,
      order_number: order.orderNumber,
      type: order.type,
      status: order.status,
      workflow_state: order.workflowState ?? null,
      table: order.table ?? null,
      customer: order.customer ?? null,
      agent: order.agent ?? null,
      subtotal: order.subtotal,
      tax_amount: order.taxAmount,
      discount_amount: order.discountAmount,
      total: order.total,
      notes: order.notes ?? null,
      delivery_address: order.deliveryAddress ?? null,
      paid_at: order.paidAt ?? null,
      created_at: order.createdAt,
      items: order.items ?? [],
      payments: order.payments ?? [],
    };
  }
}
