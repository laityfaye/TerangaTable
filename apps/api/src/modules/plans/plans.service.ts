import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const plans = await this.prisma.plan.findMany({
      orderBy: { priceMonthly: 'asc' },
      include: {
        _count: { select: { tenants: true } },
      },
    });

    return {
      data: plans.map((p) => ({
        id: p.id,
        name: p.name,
        price_monthly: Number(p.priceMonthly),
        price_yearly: Number(p.priceYearly),
        max_users: p.maxUsers,
        max_products: p.maxProducts,
        features: p.features as Record<string, boolean>,
        is_active: p.isActive,
        tenants_count: p._count.tenants,
      })),
    };
  }

  // Public — consommé par la landing page (section tarifs), sans auth.
  // N'expose que les champs pertinents pour un visiteur (pas de tenants_count).
  async findAllPublic() {
    const plans = await this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: 'asc' },
    });

    return {
      data: plans.map((p) => ({
        id: p.id,
        name: p.name,
        price_monthly: Number(p.priceMonthly),
        price_yearly: Number(p.priceYearly),
        max_users: p.maxUsers,
        max_products: p.maxProducts,
        features: p.features as Record<string, boolean>,
      })),
    };
  }

  async create(dto: CreatePlanDto) {
    const plan = await this.prisma.plan.create({
      data: {
        name: dto.name,
        priceMonthly: dto.priceMonthly,
        priceYearly: dto.priceYearly,
        maxUsers: dto.maxUsers,
        maxProducts: dto.maxProducts,
        features: dto.features as Prisma.InputJsonValue,
        isActive: dto.isActive ?? true,
      },
    });

    return { data: { id: plan.id } };
  }

  async update(id: string, dto: UpdatePlanDto) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan introuvable');

    const updated = await this.prisma.plan.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.priceMonthly !== undefined && { priceMonthly: dto.priceMonthly }),
        ...(dto.priceYearly !== undefined && { priceYearly: dto.priceYearly }),
        ...(dto.maxUsers !== undefined && { maxUsers: dto.maxUsers }),
        ...(dto.maxProducts !== undefined && { maxProducts: dto.maxProducts }),
        ...(dto.features !== undefined && { features: dto.features as Prisma.InputJsonValue }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    return { data: { id: updated.id } };
  }
}
