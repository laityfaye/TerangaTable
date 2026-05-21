import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisCacheService } from '../../common/services/redis-cache.service';
import { PaymentPublisher } from '../../events/publishers/payment.publisher';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ListPaymentsDto } from './dto/list-payments.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publisher: PaymentPublisher,
    private readonly cache: RedisCacheService,
  ) {}

  // ── Create ────────────────────────────────────────────────────────────────

  async createPayment(tenantId: string, dto: CreatePaymentDto) {
    // Validate order belongs to tenant
    const order = await this.prisma.order.findFirst({
      where: { id: dto.order_id, tenantId },
      include: {
        payments: {
          where: { status: { in: ['completed'] } },
          select: { amount: true },
        },
      },
    });

    if (!order) throw new NotFoundException('Commande introuvable');

    const alreadyPaid = order.payments.reduce(
      (sum, p) => sum + parseFloat(p.amount.toString()),
      0,
    );
    const orderTotal  = parseFloat(order.total.toString());
    const remaining   = parseFloat((orderTotal - alreadyPaid).toFixed(2));

    if (dto.amount > remaining + 0.001) {
      throw new BadRequestException(
        `Montant trop élevé. Solde restant : ${remaining}`,
      );
    }

    const payment = await this.prisma.payment.create({
      data: {
        tenantId,
        orderId:   dto.order_id,
        method:    dto.method,
        amount:    dto.amount.toString(),
        reference: dto.reference ?? null,
        status:    'completed',
        metadata:  (dto.metadata ?? {}) as object,
      },
    });

    // Check if order is now fully paid
    const newPaid = parseFloat((alreadyPaid + dto.amount).toFixed(2));
    const isFullyPaid = newPaid >= orderTotal - 0.001;

    if (isFullyPaid) {
      // Find "Payée" terminal state in the order workflow
      const paidState = await this.prisma.workflowState.findFirst({
        where: {
          tenantId,
          slug: { in: ['paid', 'payee', 'completed', 'terminee'] },
        },
        orderBy: { isTerminal: 'desc' },
      });

      await this.prisma.order.update({
        where: { id: dto.order_id },
        data: {
          paidAt: new Date(),
          status: 'paid',
          ...(paidState && { workflowStateId: paidState.id }),
        },
      });
    }

    await this.publisher.publish('payment.received', {
      tenantId,
      paymentId: payment.id,
      orderId:   dto.order_id,
      method:    dto.method,
      amount:    dto.amount,
      isFullyPaid,
    });

    // Invalide le cache analytics pour ce tenant
    void this.cache.client.keys(`analytics:${tenantId}:*`)
      .then((keys) => keys.length > 0 ? this.cache.client.del(...keys) : Promise.resolve(0))
      .catch(() => null);

    return this.mapPayment(payment);
  }

  // ── List ──────────────────────────────────────────────────────────────────

  async findAll(tenantId: string, query: ListPaymentsDto) {
    const { page = 1, limit = 50, method, status, date_from, date_to } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId };
    if (method) where['method'] = method;
    if (status) where['status'] = status;
    if (date_from || date_to) {
      where['createdAt'] = {
        ...(date_from && { gte: new Date(date_from) }),
        ...(date_to   && { lte: new Date(date_to) }),
      };
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: { select: { id: true, orderNumber: true } },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data: payments.map((p) => this.mapPayment(p)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Find One ──────────────────────────────────────────────────────────────

  async findOne(tenantId: string, id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, tenantId },
      include: {
        order: { select: { id: true, orderNumber: true, total: true } },
      },
    });

    if (!payment) throw new NotFoundException('Paiement introuvable');
    return this.mapPayment(payment);
  }

  // ── Refund ────────────────────────────────────────────────────────────────

  async refund(tenantId: string, id: string, dto: RefundPaymentDto) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, tenantId },
    });

    if (!payment) throw new NotFoundException('Paiement introuvable');
    if (payment.status === 'refunded') {
      throw new BadRequestException('Ce paiement est déjà remboursé');
    }
    if (payment.status !== 'completed') {
      throw new BadRequestException('Seuls les paiements complétés peuvent être remboursés');
    }

    const [original, refundEntry] = await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id },
        data: { status: 'refunded' },
      }),
      this.prisma.payment.create({
        data: {
          tenantId,
          orderId:   payment.orderId,
          method:    payment.method,
          amount:    (-parseFloat(payment.amount.toString())).toString(),
          reference: payment.reference,
          status:    'refunded',
          metadata:  {
            refund_of:  id,
            reason:     dto.reason ?? null,
          } as object,
        },
      }),
    ]);

    await this.publisher.publish('payment.refunded', {
      tenantId,
      originalPaymentId: original.id,
      refundPaymentId:   refundEntry.id,
      orderId:           payment.orderId,
      amount:            parseFloat(payment.amount.toString()),
      reason:            dto.reason,
    });

    return {
      refunded:        true,
      original:        this.mapPayment(original),
      refund_payment:  this.mapPayment(refundEntry),
    };
  }

  // ── Summary ───────────────────────────────────────────────────────────────

  async getSummary(tenantId: string, query: { date_from?: string; date_to?: string }) {
    const where: Record<string, unknown> = {
      tenantId,
      status: 'completed',
    };

    if (query.date_from || query.date_to) {
      where['createdAt'] = {
        ...(query.date_from && { gte: new Date(query.date_from) }),
        ...(query.date_to   && { lte: new Date(query.date_to) }),
      };
    }

    const payments = await this.prisma.payment.findMany({
      where,
      select: { method: true, amount: true, createdAt: true },
    });

    const byMethod: Record<string, number> = {};
    let total = 0;

    for (const p of payments) {
      const amt = parseFloat(p.amount.toString());
      byMethod[p.method] = (byMethod[p.method] ?? 0) + amt;
      total += amt;
    }

    return {
      total:     parseFloat(total.toFixed(2)),
      by_method: byMethod,
      count:     payments.length,
    };
  }

  // ── Mapper ────────────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapPayment(payment: any) {
    return {
      id:         payment.id,
      order_id:   payment.orderId,
      order:      payment.order
        ? { id: payment.order.id, order_number: payment.order.orderNumber }
        : undefined,
      method:     payment.method,
      amount:     parseFloat(payment.amount.toString()),
      reference:  payment.reference ?? null,
      status:     payment.status,
      metadata:   payment.metadata,
      created_at: payment.createdAt,
    };
  }
}
