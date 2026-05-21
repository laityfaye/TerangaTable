import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';

@Injectable()
export class DriversService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const drivers = await this.prisma.deliveryAgent.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      include: {
        zone: { select: { id: true, name: true } },
        _count: {
          select: {
            deliveries: {
              where: {
                status: 'delivered',
                deliveredAt: { gte: today },
              },
            },
          },
        },
      },
    });
    return drivers.map(this.map);
  }

  async findOne(tenantId: string, id: string) {
    const driver = await this.prisma.deliveryAgent.findFirst({
      where: { id, tenantId },
      include: { zone: { select: { id: true, name: true } } },
    });
    if (!driver) throw new NotFoundException('Livreur introuvable');
    return this.map(driver);
  }

  async create(tenantId: string, dto: CreateDriverDto) {
    const driver = await this.prisma.deliveryAgent.create({
      data: {
        tenantId,
        userId: dto.user_id,
        name: dto.name,
        phone: dto.phone ?? null,
        zoneId: dto.zone_id ?? null,
        isAvailable: false,
      },
      include: { zone: { select: { id: true, name: true } } },
    });
    return this.map(driver);
  }

  async update(tenantId: string, id: string, dto: UpdateDriverDto) {
    await this.ensureExists(tenantId, id);
    const driver = await this.prisma.deliveryAgent.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.zone_id !== undefined && { zoneId: dto.zone_id }),
        ...(dto.is_available !== undefined && { isAvailable: dto.is_available }),
      },
      include: { zone: { select: { id: true, name: true } } },
    });
    return this.map(driver);
  }

  async remove(tenantId: string, id: string) {
    await this.ensureExists(tenantId, id);
    await this.prisma.deliveryAgent.delete({ where: { id } });
    return { deleted: true };
  }

  async toggleAvailability(tenantId: string, id: string) {
    const driver = await this.ensureExists(tenantId, id);
    const updated = await this.prisma.deliveryAgent.update({
      where: { id },
      data: { isAvailable: !driver.isAvailable },
      include: { zone: { select: { id: true, name: true } } },
    });
    return this.map(updated);
  }

  private async ensureExists(tenantId: string, id: string) {
    const driver = await this.prisma.deliveryAgent.findFirst({ where: { id, tenantId } });
    if (!driver) throw new NotFoundException('Livreur introuvable');
    return driver;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private map(d: any) {
    return {
      id: d.id,
      user_id: d.userId,
      name: d.name,
      phone: d.phone ?? null,
      is_available: d.isAvailable,
      zone: d.zone ?? null,
      deliveries_today: d._count?.deliveries ?? 0,
      created_at: d.createdAt,
    };
  }
}
