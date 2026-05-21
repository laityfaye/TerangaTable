import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ListCustomersDto } from './dto/list-customers.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Prisma } from '@prisma/client';

type CustomerSegment = 'new' | 'regular' | 'vip' | 'inactive';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  // ── VIP threshold ─────────────────────────────────────────────────────────

  private async getVipThreshold(tenantId: string): Promise<number> {
    const count = await this.prisma.customer.count({ where: { tenantId } });
    if (count < 2) return Infinity;

    const vipCount = Math.max(1, Math.ceil(count * 0.1));
    const candidates = await this.prisma.customer.findMany({
      where: { tenantId },
      orderBy: { totalSpent: 'desc' },
      take: vipCount,
      select: { totalSpent: true },
    });

    const lowestVip = candidates[candidates.length - 1];
    return lowestVip ? parseFloat(lowestVip.totalSpent.toString()) : Infinity;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private computeSegment(customer: any, vipThreshold: number): CustomerSegment {
    const now = Date.now();
    const spent = parseFloat(customer.totalSpent?.toString() ?? '0');
    const lastVisit: Date | null = customer.lastVisitAt ?? null;
    const createdAt: Date = customer.createdAt;

    if (spent > 0 && spent >= vipThreshold) return 'vip';

    const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;
    if (lastVisit && lastVisit.getTime() < sixtyDaysAgo) return 'inactive';

    if (customer.totalOrders >= 3 && lastVisit && lastVisit.getTime() >= sixtyDaysAgo) {
      return 'regular';
    }

    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    if (createdAt.getTime() >= thirtyDaysAgo && customer.totalOrders <= 1) return 'new';

    return 'new';
  }

  // ── Segment counts ────────────────────────────────────────────────────────

  private async getSegmentCounts(tenantId: string, vipThreshold: number) {
    const all = await this.prisma.customer.findMany({
      where: { tenantId },
      select: {
        totalOrders: true,
        totalSpent: true,
        lastVisitAt: true,
        createdAt: true,
      },
    });

    const counts = { all: all.length, new: 0, regular: 0, vip: 0, inactive: 0 };
    for (const c of all) {
      counts[this.computeSegment(c, vipThreshold)]++;
    }
    return counts;
  }

  // ── Segment WHERE clause ──────────────────────────────────────────────────

  private buildSegmentWhere(
    segment: string | undefined,
    vipThreshold: number,
  ): Prisma.CustomerWhereInput {
    if (!segment) return {};
    const now = new Date();
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    switch (segment) {
      case 'vip':
        return { totalSpent: { gte: vipThreshold === Infinity ? 999_999_999 : vipThreshold } };
      case 'inactive':
        return { lastVisitAt: { lt: sixtyDaysAgo } };
      case 'regular':
        return { totalOrders: { gte: 3 }, lastVisitAt: { gte: sixtyDaysAgo } };
      case 'new':
        return { createdAt: { gte: thirtyDaysAgo }, totalOrders: { lte: 1 } };
      default:
        return {};
    }
  }

  // ── List ──────────────────────────────────────────────────────────────────

  async findAll(tenantId: string, query: ListCustomersDto) {
    const { page = 1, limit = 20, search, segment, sort_by = 'created_at', sort_order = 'desc' } = query;
    const skip = (page - 1) * limit;

    const vipThreshold = await this.getVipThreshold(tenantId);

    const segmentWhere = this.buildSegmentWhere(segment, vipThreshold);

    const searchWhere: Prisma.CustomerWhereInput = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const where: Prisma.CustomerWhereInput = { tenantId, ...segmentWhere, ...searchWhere };

    const sortKey = sort_by === 'total_spent'
      ? 'totalSpent'
      : sort_by === 'last_visit_at'
      ? 'lastVisitAt'
      : sort_by === 'total_orders'
      ? 'totalOrders'
      : 'createdAt';

    const [customers, total, counts] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortKey]: sort_order },
      }),
      this.prisma.customer.count({ where }),
      this.getSegmentCounts(tenantId, vipThreshold),
    ]);

    return {
      data: customers.map((c) => this.mapCustomer(c, vipThreshold)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        counts,
      },
    };
  }

  // ── Find One ──────────────────────────────────────────────────────────────

  async findOne(tenantId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({ where: { id, tenantId } });
    if (!customer) throw new NotFoundException('Client introuvable');

    const vipThreshold = await this.getVipThreshold(tenantId);
    return this.mapCustomer(customer, vipThreshold);
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async create(tenantId: string, dto: CreateCustomerDto) {
    if (dto.email) {
      const existing = await this.prisma.customer.findFirst({
        where: { tenantId, email: dto.email },
      });
      if (existing) throw new ConflictException('Un client avec cet email existe déjà');
    }

    const customer = await this.prisma.customer.create({
      data: {
        tenantId,
        firstName: dto.first_name,
        lastName: dto.last_name,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        notes: dto.notes ?? null,
      },
    });

    const vipThreshold = await this.getVipThreshold(tenantId);
    return this.mapCustomer(customer, vipThreshold);
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async update(tenantId: string, id: string, dto: UpdateCustomerDto) {
    await this.ensureExists(tenantId, id);

    if (dto.email) {
      const conflict = await this.prisma.customer.findFirst({
        where: { tenantId, email: dto.email, NOT: { id } },
      });
      if (conflict) throw new ConflictException('Email déjà utilisé par un autre client');
    }

    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        ...(dto.first_name !== undefined && { firstName: dto.first_name }),
        ...(dto.last_name !== undefined && { lastName: dto.last_name }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });

    const vipThreshold = await this.getVipThreshold(tenantId);
    return this.mapCustomer(customer, vipThreshold);
  }

  // ── Archive (hard delete, schema ne supporte pas soft delete) ─────────────

  async archive(tenantId: string, id: string) {
    await this.ensureExists(tenantId, id);
    await this.prisma.customer.delete({ where: { id } });
    return { archived: true };
  }

  // ── Customer orders ───────────────────────────────────────────────────────

  async getOrders(tenantId: string, customerId: string) {
    await this.ensureExists(tenantId, customerId);

    const orders = await this.prisma.order.findMany({
      where: { tenantId, customerId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        workflowState: { select: { id: true, name: true, color: true, slug: true } },
        items: {
          select: { id: true, productName: true, quantity: true, lineTotal: true },
        },
      },
    });

    return orders.map((o) => ({
      id: o.id,
      order_number: o.orderNumber,
      type: o.type,
      workflow_state: o.workflowState,
      total: o.total,
      created_at: o.createdAt,
      items_count: o.items.length,
      items: o.items,
    }));
  }

  // ── Loyalty history ───────────────────────────────────────────────────────

  async getLoyaltyHistory(tenantId: string, customerId: string) {
    await this.ensureExists(tenantId, customerId);

    return this.prisma.loyaltyTransaction.findMany({
      where: { tenantId, customerId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  // ── Auto find-or-create by email (used by orders/payments) ───────────────

  async findOrCreateByEmail(
    tenantId: string,
    email: string,
    firstName = 'Client',
    lastName = '',
    phone?: string,
  ) {
    const existing = await this.prisma.customer.findFirst({ where: { tenantId, email } });
    if (existing) return existing;

    return this.prisma.customer.create({
      data: { tenantId, firstName, lastName, email, phone: phone ?? null },
    });
  }

  // ── Update stats after payment (called async after each payment) ──────────

  async updateStatsAfterPayment(tenantId: string, customerId: string, amount: number) {
    await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        totalOrders: { increment: 1 },
        totalSpent: { increment: amount },
        lastVisitAt: new Date(),
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async ensureExists(tenantId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({ where: { id, tenantId } });
    if (!customer) throw new NotFoundException('Client introuvable');
    return customer;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapCustomer(customer: any, vipThreshold: number) {
    return {
      id: customer.id,
      tenant_id: customer.tenantId,
      first_name: customer.firstName,
      last_name: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      total_orders: customer.totalOrders,
      total_spent: customer.totalSpent,
      loyalty_points: customer.loyaltyPoints,
      last_visit_at: customer.lastVisitAt,
      segment: this.computeSegment(customer, vipThreshold),
      notes: customer.notes,
      created_at: customer.createdAt,
    };
  }
}
