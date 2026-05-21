import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { TableAvailabilityDto } from './dto/table-availability.dto';

@Injectable()
export class TablesService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Zones ─────────────────────────────────────────────────────────────────

  async findAllZones(tenantId: string) {
    const zones = await this.prisma.zone.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      include: { tables: { where: { isActive: true }, select: { id: true } } },
    });
    return zones.map((z) => ({
      id: z.id,
      name: z.name,
      is_active: z.isActive,
      table_count: z.tables.length,
    }));
  }

  async createZone(tenantId: string, dto: CreateZoneDto) {
    const zone = await this.prisma.zone.create({
      data: { tenantId, name: dto.name },
    });
    return this.mapZone(zone);
  }

  async updateZone(tenantId: string, id: string, dto: UpdateZoneDto) {
    await this.ensureZoneExists(tenantId, id);
    const zone = await this.prisma.zone.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.is_active !== undefined && { isActive: dto.is_active }),
      },
    });
    return this.mapZone(zone);
  }

  async deleteZone(tenantId: string, id: string) {
    await this.ensureZoneExists(tenantId, id);
    // Unlink tables instead of cascading delete
    await this.prisma.table.updateMany({
      where: { tenantId, zoneId: id },
      data: { zoneId: null },
    });
    await this.prisma.zone.delete({ where: { id } });
    return { deleted: true };
  }

  // ── Tables ────────────────────────────────────────────────────────────────

  async findAllTables(tenantId: string, zoneId?: string) {
    const tables = await this.prisma.table.findMany({
      where: { tenantId, ...(zoneId && { zoneId }) },
      orderBy: [{ number: 'asc' }],
      include: { zone: { select: { id: true, name: true } } },
    });
    return tables.map(this.mapTable);
  }

  async findOneTable(tenantId: string, id: string) {
    const table = await this.prisma.table.findFirst({
      where: { id, tenantId },
      include: { zone: { select: { id: true, name: true } } },
    });
    if (!table) throw new NotFoundException('Table introuvable');
    return this.mapTable(table);
  }

  async createTable(tenantId: string, dto: CreateTableDto) {
    const existing = await this.prisma.table.findFirst({
      where: { tenantId, number: dto.number },
    });
    if (existing) throw new ConflictException(`Table numéro "${dto.number}" existe déjà`);

    if (dto.zone_id) await this.ensureZoneExists(tenantId, dto.zone_id);

    const table = await this.prisma.table.create({
      data: {
        tenantId,
        number: dto.number,
        capacity: dto.capacity,
        shape: dto.shape,
        zoneId: dto.zone_id ?? null,
        posX: dto.pos_x ?? 0,
        posY: dto.pos_y ?? 0,
      },
      include: { zone: { select: { id: true, name: true } } },
    });
    return this.mapTable(table);
  }

  async updateTable(tenantId: string, id: string, dto: UpdateTableDto) {
    await this.ensureTableExists(tenantId, id);

    if (dto.number) {
      const conflict = await this.prisma.table.findFirst({
        where: { tenantId, number: dto.number, id: { not: id } },
      });
      if (conflict) throw new ConflictException(`Table numéro "${dto.number}" existe déjà`);
    }

    if (dto.zone_id) await this.ensureZoneExists(tenantId, dto.zone_id);

    const table = await this.prisma.table.update({
      where: { id },
      data: {
        ...(dto.number !== undefined && { number: dto.number }),
        ...(dto.capacity !== undefined && { capacity: dto.capacity }),
        ...(dto.shape !== undefined && { shape: dto.shape }),
        ...(dto.zone_id !== undefined && { zoneId: dto.zone_id }),
        ...(dto.pos_x !== undefined && { posX: dto.pos_x }),
        ...(dto.pos_y !== undefined && { posY: dto.pos_y }),
        ...(dto.is_active !== undefined && { isActive: dto.is_active }),
      },
      include: { zone: { select: { id: true, name: true } } },
    });
    return this.mapTable(table);
  }

  async deleteTable(tenantId: string, id: string) {
    await this.ensureTableExists(tenantId, id);
    await this.prisma.table.delete({ where: { id } });
    return { deleted: true };
  }

  // ── Availability ──────────────────────────────────────────────────────────

  async getAvailability(tenantId: string, dto: TableAvailabilityDto) {
    const requestedAt = new Date(dto.date);
    const durationMin = dto.duration_min ?? 90;
    const requestedEnd = new Date(requestedAt.getTime() + durationMin * 60_000);

    const tables = await this.prisma.table.findMany({
      where: {
        tenantId,
        isActive: true,
        capacity: { gte: dto.party_size },
      },
      include: { zone: { select: { id: true, name: true } } },
      orderBy: { capacity: 'asc' },
    });

    // Fetch reservations that could overlap with the requested slot
    const candidates = await this.prisma.reservation.findMany({
      where: {
        tenantId,
        tableId: { in: tables.map((t) => t.id) },
        status: { notIn: ['cancelled', 'no_show'] },
        // existing.reservedAt < requestedEnd
        reservedAt: { lt: requestedEnd },
      },
      select: { tableId: true, reservedAt: true, durationMin: true },
    });

    const busyTableIds = new Set<string>();
    for (const r of candidates) {
      const rEnd = new Date(r.reservedAt.getTime() + r.durationMin * 60_000);
      // Overlap: existing.reservedAt < requestedEnd AND rEnd > requestedAt
      if (rEnd > requestedAt) {
        if (r.tableId) busyTableIds.add(r.tableId);
      }
    }

    return tables.map((t) => ({
      ...this.mapTable(t),
      available: !busyTableIds.has(t.id),
    }));
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async ensureZoneExists(tenantId: string, id: string) {
    const zone = await this.prisma.zone.findFirst({ where: { id, tenantId } });
    if (!zone) throw new NotFoundException('Zone introuvable');
    return zone;
  }

  private async ensureTableExists(tenantId: string, id: string) {
    const table = await this.prisma.table.findFirst({ where: { id, tenantId } });
    if (!table) throw new NotFoundException('Table introuvable');
    return table;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapTable(t: any) {
    return {
      id: t.id,
      number: t.number,
      capacity: t.capacity,
      shape: t.shape,
      zone: t.zone ?? null,
      pos_x: t.posX,
      pos_y: t.posY,
      is_active: t.isActive,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapZone(z: any) {
    return {
      id: z.id,
      name: z.name,
      is_active: z.isActive,
    };
  }
}
