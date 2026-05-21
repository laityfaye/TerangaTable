import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReservationPublisher } from '../../events/publishers/reservation.publisher';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ListReservationsDto } from './dto/list-reservations.dto';

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly publisher: ReservationPublisher,
  ) {}

  // ── List ──────────────────────────────────────────────────────────────────

  async findAll(tenantId: string, query: ListReservationsDto) {
    const { page = 1, limit = 50, status, date, date_from, date_to, search } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId };

    if (status) where['status'] = status;

    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      where['reservedAt'] = { gte: dayStart, lte: dayEnd };
    } else if (date_from || date_to) {
      where['reservedAt'] = {
        ...(date_from && { gte: new Date(date_from) }),
        ...(date_to && { lte: new Date(date_to) }),
      };
    }

    if (search) {
      where['OR'] = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [reservations, total] = await Promise.all([
      this.prisma.reservation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { reservedAt: 'asc' },
        include: {
          table: { select: { id: true, number: true, capacity: true, shape: true } },
          customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
        },
      }),
      this.prisma.reservation.count({ where }),
    ]);

    return {
      data: reservations.map(this.mapReservation),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Find One ──────────────────────────────────────────────────────────────

  async findOne(tenantId: string, id: string) {
    const r = await this.prisma.reservation.findFirst({
      where: { id, tenantId },
      include: {
        table: {
          select: {
            id: true,
            number: true,
            capacity: true,
            shape: true,
            zone: { select: { id: true, name: true } },
          },
        },
        customer: {
          select: { id: true, firstName: true, lastName: true, phone: true, email: true },
        },
      },
    });
    if (!r) throw new NotFoundException('Réservation introuvable');
    return this.mapReservation(r);
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async create(tenantId: string, dto: CreateReservationDto) {
    const reservedAt = new Date(dto.reserved_at);
    const durationMin = dto.duration_min ?? 90;

    if (dto.table_id) {
      await this.assertNoConflict(tenantId, dto.table_id, reservedAt, durationMin, null);
    }

    const r = await this.prisma.reservation.create({
      data: {
        tenantId,
        customerName: dto.customer_name,
        customerEmail: dto.customer_email ?? null,
        customerPhone: dto.customer_phone ?? null,
        customerId: dto.customer_id ?? null,
        partySize: dto.party_size,
        tableId: dto.table_id ?? null,
        reservedAt,
        durationMin,
        status: 'pending',
        source: dto.source,
        notes: dto.notes ?? null,
      },
      include: {
        table: { select: { id: true, number: true, capacity: true, shape: true } },
        customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    });

    await this.publisher.publish('reservation.created', {
      tenantId,
      reservationId: r.id,
      customerName: r.customerName,
      reservedAt: r.reservedAt,
    });

    this.scheduleReminders(tenantId, r.id, reservedAt);

    return this.mapReservation(r);
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async update(tenantId: string, id: string, dto: UpdateReservationDto) {
    const existing = await this.ensureExists(tenantId, id);

    const reservedAt = dto.reserved_at ? new Date(dto.reserved_at) : existing.reservedAt;
    const durationMin = dto.duration_min ?? existing.durationMin;
    const tableId = dto.table_id !== undefined ? dto.table_id : existing.tableId;

    if (tableId && (dto.table_id !== undefined || dto.reserved_at || dto.duration_min)) {
      await this.assertNoConflict(tenantId, tableId, reservedAt, durationMin, id);
    }

    const r = await this.prisma.reservation.update({
      where: { id },
      data: {
        ...(dto.table_id !== undefined && { tableId: dto.table_id }),
        ...(dto.reserved_at !== undefined && { reservedAt }),
        ...(dto.duration_min !== undefined && { durationMin }),
        ...(dto.party_size !== undefined && { partySize: dto.party_size }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: {
        table: { select: { id: true, number: true, capacity: true, shape: true } },
        customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    });

    await this.publisher.publish('reservation.updated', {
      tenantId,
      reservationId: id,
      status: r.status,
    });

    return this.mapReservation(r);
  }

  // ── Cancel ────────────────────────────────────────────────────────────────

  async cancel(tenantId: string, id: string) {
    await this.ensureExists(tenantId, id);

    const r = await this.prisma.reservation.update({
      where: { id },
      data: { status: 'cancelled' },
      include: {
        table: { select: { id: true, number: true, capacity: true, shape: true } },
        customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    });

    await this.publisher.publish('reservation.cancelled', { tenantId, reservationId: id });
    return this.mapReservation(r);
  }

  // ── Conflict detection ────────────────────────────────────────────────────

  private async assertNoConflict(
    tenantId: string,
    tableId: string,
    reservedAt: Date,
    durationMin: number,
    excludeId: string | null,
  ) {
    const endAt = new Date(reservedAt.getTime() + durationMin * 60_000);

    const candidates = await this.prisma.reservation.findMany({
      where: {
        tenantId,
        tableId,
        status: { notIn: ['cancelled', 'no_show'] },
        ...(excludeId && { id: { not: excludeId } }),
        reservedAt: { lt: endAt },
      },
      select: { id: true, reservedAt: true, durationMin: true },
    });

    for (const c of candidates) {
      const cEnd = new Date(c.reservedAt.getTime() + c.durationMin * 60_000);
      if (cEnd > reservedAt) {
        throw new ConflictException(
          `La table est déjà réservée sur ce créneau (conflit avec la réservation ${c.id})`,
        );
      }
    }
  }

  // ── Reminder scheduling ───────────────────────────────────────────────────

  private scheduleReminders(tenantId: string, reservationId: string, reservedAt: Date) {
    const now = Date.now();

    const j1Ms = reservedAt.getTime() - 24 * 60 * 60_000 - now;
    if (j1Ms > 0) {
      setTimeout(() => {
        this.logger.log(`Rappel J-1 envoyé pour réservation ${reservationId}`);
        void this.publisher.publish('reservation.reminder_j1', { tenantId, reservationId });
      }, j1Ms);
    }

    const h2Ms = reservedAt.getTime() - 2 * 60 * 60_000 - now;
    if (h2Ms > 0) {
      setTimeout(() => {
        this.logger.log(`Rappel H-2 envoyé pour réservation ${reservationId}`);
        void this.publisher.publish('reservation.reminder_h2', { tenantId, reservationId });
      }, h2Ms);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async ensureExists(tenantId: string, id: string) {
    const r = await this.prisma.reservation.findFirst({ where: { id, tenantId } });
    if (!r) throw new NotFoundException('Réservation introuvable');
    return r;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapReservation(r: any) {
    return {
      id: r.id,
      customer_name: r.customerName,
      customer_email: r.customerEmail ?? null,
      customer_phone: r.customerPhone ?? null,
      customer_id: r.customerId ?? null,
      customer: r.customer ?? null,
      party_size: r.partySize,
      table: r.table ?? null,
      table_id: r.tableId ?? null,
      reserved_at: r.reservedAt,
      duration_min: r.durationMin,
      status: r.status,
      source: r.source,
      notes: r.notes ?? null,
      reminder_sent: r.reminderSent,
      created_at: r.createdAt,
    };
  }
}
