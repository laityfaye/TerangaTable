import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateOptionGroupDto } from './dto/create-option-group.dto';
import { UpdateOptionGroupDto } from './dto/update-option-group.dto';
import { CreateOptionDto } from './dto/create-option.dto';
import { UpdateOptionDto } from './dto/update-option.dto';

@Injectable()
export class OptionsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Option Groups ─────────────────────────────────────────────────────────

  async findGroups(tenantId: string, productId: string) {
    await this.assertProductExists(tenantId, productId);

    return this.prisma.productOptionGroup.findMany({
      where: { tenantId, productId },
      include: {
        options: {
          orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createGroup(tenantId: string, productId: string, dto: CreateOptionGroupDto) {
    await this.assertProductExists(tenantId, productId);

    return this.prisma.productOptionGroup.create({
      data: {
        tenantId,
        productId,
        name: dto.name,
        type: dto.type as never,
        isRequired: dto.is_required ?? false,
        minSelect: dto.min_select ?? 0,
        maxSelect: dto.max_select ?? 1,
      },
      include: { options: true },
    });
  }

  async updateGroup(
    tenantId: string,
    productId: string,
    groupId: string,
    dto: UpdateOptionGroupDto,
  ) {
    await this.assertGroupExists(tenantId, productId, groupId);

    return this.prisma.productOptionGroup.update({
      where: { id: groupId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type as never }),
        ...(dto.is_required !== undefined && { isRequired: dto.is_required }),
        ...(dto.min_select !== undefined && { minSelect: dto.min_select }),
        ...(dto.max_select !== undefined && { maxSelect: dto.max_select }),
      },
      include: { options: true },
    });
  }

  async removeGroup(tenantId: string, productId: string, groupId: string) {
    await this.assertGroupExists(tenantId, productId, groupId);
    return this.prisma.productOptionGroup.delete({ where: { id: groupId } });
  }

  // ── Options ───────────────────────────────────────────────────────────────

  async createOption(tenantId: string, groupId: string, dto: CreateOptionDto) {
    await this.assertGroupExistsById(tenantId, groupId);

    return this.prisma.productOption.create({
      data: {
        tenantId,
        groupId,
        name: dto.name,
        priceDelta: dto.price_delta ?? 0,
        isDefault: dto.is_default ?? false,
        isAvailable: dto.is_available ?? true,
      },
    });
  }

  async updateOption(
    tenantId: string,
    groupId: string,
    optionId: string,
    dto: UpdateOptionDto,
  ) {
    await this.assertOptionExists(tenantId, groupId, optionId);

    return this.prisma.productOption.update({
      where: { id: optionId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.price_delta !== undefined && { priceDelta: dto.price_delta }),
        ...(dto.is_default !== undefined && { isDefault: dto.is_default }),
        ...(dto.is_available !== undefined && { isAvailable: dto.is_available }),
      },
    });
  }

  async removeOption(tenantId: string, groupId: string, optionId: string) {
    await this.assertOptionExists(tenantId, groupId, optionId);
    return this.prisma.productOption.delete({ where: { id: optionId } });
  }

  // ── Guards ────────────────────────────────────────────────────────────────

  private async assertProductExists(tenantId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId },
    });
    if (!product) throw new NotFoundException('Produit introuvable');
    return product;
  }

  private async assertGroupExists(tenantId: string, productId: string, groupId: string) {
    const group = await this.prisma.productOptionGroup.findFirst({
      where: { id: groupId, tenantId, productId },
    });
    if (!group) throw new NotFoundException('Groupe d\'options introuvable');
    return group;
  }

  private async assertGroupExistsById(tenantId: string, groupId: string) {
    const group = await this.prisma.productOptionGroup.findFirst({
      where: { id: groupId, tenantId },
    });
    if (!group) throw new NotFoundException('Groupe d\'options introuvable');
    return group;
  }

  private async assertOptionExists(tenantId: string, groupId: string, optionId: string) {
    const option = await this.prisma.productOption.findFirst({
      where: { id: optionId, tenantId, groupId },
    });
    if (!option) throw new NotFoundException('Option introuvable');
    return option;
  }
}
