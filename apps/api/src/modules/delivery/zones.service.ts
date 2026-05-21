import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

@Injectable()
export class ZonesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    const zones = await this.prisma.deliveryZone.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { deliveryAgents: true } } },
    });
    return zones.map(this.map);
  }

  async findOne(tenantId: string, id: string) {
    const zone = await this.prisma.deliveryZone.findFirst({ where: { id, tenantId } });
    if (!zone) throw new NotFoundException('Zone introuvable');
    return this.map(zone);
  }

  async create(tenantId: string, dto: CreateZoneDto) {
    const zone = await this.prisma.deliveryZone.create({
      data: {
        tenantId,
        name: dto.name,
        type: dto.type,
        radiusKm: dto.radius_km != null ? dto.radius_km.toString() : null,
        polygon: dto.polygon != null ? (dto.polygon as Prisma.InputJsonValue) : Prisma.DbNull,
        minOrder: (dto.min_order ?? 0).toString(),
        deliveryFee: (dto.delivery_fee ?? 0).toString(),
        isActive: dto.is_active ?? true,
      },
      include: { _count: { select: { deliveryAgents: true } } },
    });
    return this.map(zone);
  }

  async update(tenantId: string, id: string, dto: UpdateZoneDto) {
    await this.findOne(tenantId, id);
    const zone = await this.prisma.deliveryZone.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.radius_km !== undefined && { radiusKm: dto.radius_km != null ? dto.radius_km.toString() : null }),
        ...(dto.polygon !== undefined && { polygon: dto.polygon != null ? (dto.polygon as Prisma.InputJsonValue) : Prisma.DbNull }),
        ...(dto.min_order !== undefined && { minOrder: dto.min_order!.toString() }),
        ...(dto.delivery_fee !== undefined && { deliveryFee: dto.delivery_fee!.toString() }),
        ...(dto.is_active !== undefined && { isActive: dto.is_active }),
      },
      include: { _count: { select: { deliveryAgents: true } } },
    });
    return this.map(zone);
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.prisma.deliveryZone.delete({ where: { id } });
    return { deleted: true };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private map(z: any) {
    return {
      id: z.id,
      name: z.name,
      type: z.type,
      radius_km: z.radiusKm != null ? parseFloat(z.radiusKm.toString()) : null,
      polygon: z.polygon ?? null,
      min_order: parseFloat(z.minOrder.toString()),
      delivery_fee: parseFloat(z.deliveryFee.toString()),
      is_active: z.isActive,
      agents_count: z._count?.deliveryAgents ?? 0,
    };
  }
}
