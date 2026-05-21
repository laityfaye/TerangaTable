import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EarnPointsDto, RedeemPointsDto, LoyaltySettingsDto } from './dto/loyalty.dto';

const LOYALTY_SETTINGS_KEY = 'loyalty_config';
const LOYALTY_CATEGORY = 'loyalty';

const DEFAULT_SETTINGS: LoyaltySettingsDto = {
  enabled: false,
  points_per_amount: 1000,
  redemption_points: 100,
  redemption_value: 500,
  expiry_days: 0,
  vip_threshold_type: 'percent',
  vip_threshold_value: 10,
  rewards: [],
};

@Injectable()
export class LoyaltyService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Settings ──────────────────────────────────────────────────────────────

  async getSettings(tenantId: string): Promise<LoyaltySettingsDto> {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: LOYALTY_SETTINGS_KEY } },
    });

    if (!setting) return DEFAULT_SETTINGS;
    return setting.value as unknown as LoyaltySettingsDto;
  }

  async updateSettings(tenantId: string, dto: LoyaltySettingsDto) {
    await this.prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: LOYALTY_SETTINGS_KEY } },
      update: { value: dto as unknown as object },
      create: {
        tenantId,
        key: LOYALTY_SETTINGS_KEY,
        value: dto as unknown as object,
        type: 'json',
        category: LOYALTY_CATEGORY,
      },
    });
    return dto;
  }

  // ── Earn points ───────────────────────────────────────────────────────────

  async earn(tenantId: string, dto: EarnPointsDto) {
    const settings = await this.getSettings(tenantId);
    if (!settings.enabled) return { points_earned: 0, new_balance: 0 };

    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customer_id, tenantId },
      select: { id: true, loyaltyPoints: true },
    });
    if (!customer) throw new NotFoundException('Client introuvable');

    const pointsEarned = Math.floor(dto.amount / settings.points_per_amount);
    if (pointsEarned === 0) {
      return { points_earned: 0, new_balance: customer.loyaltyPoints };
    }

    const balanceBefore = customer.loyaltyPoints;
    const balanceAfter = balanceBefore + pointsEarned;

    await this.prisma.$transaction([
      this.prisma.customer.update({
        where: { id: dto.customer_id },
        data: { loyaltyPoints: balanceAfter },
      }),
      this.prisma.loyaltyTransaction.create({
        data: {
          tenantId,
          customerId: dto.customer_id,
          orderId: dto.order_id ?? null,
          type: 'earn',
          points: pointsEarned,
          balanceBefore,
          balanceAfter,
          description: `+${pointsEarned} pts sur achat de ${dto.amount}`,
        },
      }),
    ]);

    return { points_earned: pointsEarned, new_balance: balanceAfter };
  }

  // ── Redeem points ─────────────────────────────────────────────────────────

  async redeem(tenantId: string, dto: RedeemPointsDto) {
    const settings = await this.getSettings(tenantId);
    if (!settings.enabled) throw new BadRequestException('Programme de fidélité désactivé');

    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customer_id, tenantId },
      select: { id: true, loyaltyPoints: true },
    });
    if (!customer) throw new NotFoundException('Client introuvable');

    if (customer.loyaltyPoints < dto.points) {
      throw new BadRequestException(
        `Solde insuffisant : ${customer.loyaltyPoints} pts disponibles`,
      );
    }

    const discountValue =
      Math.floor(dto.points / settings.redemption_points) * settings.redemption_value;

    const balanceBefore = customer.loyaltyPoints;
    const balanceAfter = balanceBefore - dto.points;

    await this.prisma.$transaction([
      this.prisma.customer.update({
        where: { id: dto.customer_id },
        data: { loyaltyPoints: balanceAfter },
      }),
      this.prisma.loyaltyTransaction.create({
        data: {
          tenantId,
          customerId: dto.customer_id,
          orderId: dto.order_id ?? null,
          type: 'redeem',
          points: -dto.points,
          balanceBefore,
          balanceAfter,
          description: `-${dto.points} pts = ${discountValue} de réduction`,
        },
      }),
    ]);

    return {
      points_redeemed: dto.points,
      discount_value: discountValue,
      new_balance: balanceAfter,
    };
  }

  // ── Balance ───────────────────────────────────────────────────────────────

  async getBalance(tenantId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId },
      select: { id: true, loyaltyPoints: true },
    });
    if (!customer) throw new NotFoundException('Client introuvable');

    const transactions = await this.prisma.loyaltyTransaction.findMany({
      where: { tenantId, customerId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      customer_id: customerId,
      balance: customer.loyaltyPoints,
      transactions,
    };
  }
}
