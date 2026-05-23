import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenSessionDto } from './dto/open-session.dto';
import { CloseSessionDto } from './dto/close-session.dto';

@Injectable()
export class PosService {
  constructor(private readonly prisma: PrismaService) {}

  async getHistory(tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [sessions, total] = await Promise.all([
      this.prisma.posSession.findMany({
        where: { tenantId, status: 'closed' },
        orderBy: { closedAt: 'desc' },
        skip,
        take: limit,
        include: {
          openedBy: { select: { id: true, firstName: true, lastName: true } },
          closedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.posSession.count({ where: { tenantId, status: 'closed' } }),
    ]);
    return { data: sessions, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getCurrent(tenantId: string) {
    const session = await this.prisma.posSession.findFirst({
      where: { tenantId, status: 'open' },
      include: {
        openedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { openedAt: 'desc' },
    });
    if (!session) throw new NotFoundException('Aucune session de caisse ouverte');
    return session;
  }

  async open(tenantId: string, userId: string, dto: OpenSessionDto) {
    const existing = await this.prisma.posSession.findFirst({
      where: { tenantId, status: 'open' },
    });
    if (existing) {
      throw new ConflictException('Une session de caisse est déjà ouverte');
    }

    return this.prisma.posSession.create({
      data: {
        tenantId,
        openedById: userId,
        openingAmount: dto.opening_amount,
        status: 'open',
      },
      include: {
        openedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async getStats(tenantId: string) {
    const session = await this.prisma.posSession.findFirst({
      where: { tenantId, status: 'open' },
      orderBy: { openedAt: 'desc' },
    });
    if (!session) throw new NotFoundException('Aucune session de caisse ouverte');

    const [orders, paymentsByMethod] = await Promise.all([
      this.prisma.order.count({
        where: { tenantId, paidAt: { gte: session.openedAt } },
      }),
      this.prisma.payment.groupBy({
        by: ['method'],
        where: {
          tenantId,
          status: 'completed',
          createdAt: { gte: session.openedAt },
        },
        _sum: { amount: true },
      }),
    ]);

    const salesByMethod: Record<string, number> = {};
    let totalSales = 0;
    for (const row of paymentsByMethod) {
      const amt = parseFloat((row._sum.amount ?? 0).toString());
      salesByMethod[row.method] = amt;
      totalSales += amt;
    }

    return {
      openingAmount: parseFloat(session.openingAmount.toString()),
      openedAt:      session.openedAt,
      totalOrders:   orders,
      totalSales,
      salesByMethod,
    };
  }

  async close(tenantId: string, userId: string, dto: CloseSessionDto) {
    const session = await this.prisma.posSession.findFirst({
      where: { tenantId, status: 'open' },
      orderBy: { openedAt: 'desc' },
    });
    if (!session) throw new NotFoundException('Aucune session de caisse ouverte');

    // Compute totals from orders paid during this session window
    const [orders, paymentsByMethod] = await Promise.all([
      this.prisma.order.count({
        where: {
          tenantId,
          paidAt: { gte: session.openedAt },
        },
      }),
      this.prisma.payment.groupBy({
        by: ['method'],
        where: {
          tenantId,
          status: 'completed',
          createdAt: { gte: session.openedAt },
        },
        _sum: { amount: true },
      }),
    ]);

    const salesByMethod: Record<string, number> = {};
    let totalSales = 0;
    for (const row of paymentsByMethod) {
      const amt = parseFloat((row._sum.amount ?? 0).toString());
      salesByMethod[row.method] = amt;
      totalSales += amt;
    }

    const theoreticalCash =
      parseFloat(session.openingAmount.toString()) + (salesByMethod['cash'] ?? 0);
    const cashDifference = dto.closing_amount - theoreticalCash;

    return this.prisma.posSession.update({
      where: { id: session.id },
      data: {
        closedById: userId,
        closingAmount: dto.closing_amount,
        totalSales,
        totalOrders: orders,
        salesByMethod,
        cashDifference,
        status: 'closed',
        closedAt: new Date(),
      },
      include: {
        openedBy: { select: { id: true, firstName: true, lastName: true } },
        closedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }
}
