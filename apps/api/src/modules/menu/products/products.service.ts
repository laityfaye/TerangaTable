import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ListProductsDto } from './dto/list-products.dto';

type PrismaProduct = {
  id: string;
  name: string;
  description: string | null;
  basePrice: { toNumber(): number } | number;
  imageUrl: string | null;
  categoryId: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  sku: string | null;
  sortOrder: number;
  tags: string[];
  allergens: string[];
  nutritionalInfo: Record<string, unknown> | null;
  category?: { id: string; name: string } | null;
};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private toDto(p: PrismaProduct) {
    const info = (p.nutritionalInfo ?? {}) as Record<string, unknown>;
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      base_price: typeof p.basePrice === 'number' ? p.basePrice : p.basePrice.toNumber(),
      image_url: p.imageUrl,
      category_id: p.categoryId,
      category_name: p.category?.name ?? null,
      is_available: p.isAvailable,
      is_featured: p.isFeatured,
      sku: p.sku,
      sort_order: p.sortOrder,
      tags: p.tags ?? [],
      allergens: p.allergens ?? [],
      calories: info['calories'] as number | undefined,
      proteins: info['proteins'] as number | undefined,
      carbs: info['carbs'] as number | undefined,
      fats: info['fats'] as number | undefined,
      serving_size: info['serving_size'] as string | undefined,
    };
  }

  async findAll(tenantId: string, dto: ListProductsDto) {
    const { page = 1, limit = 20, category_id, is_available, search, include_options } = dto;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      ...(category_id && { categoryId: category_id }),
      ...(is_available !== undefined && { isAvailable: is_available }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: {
          category: { select: { id: true, name: true } },
          ...(include_options && {
            optionGroups: {
              include: { options: { orderBy: { name: 'asc' } } },
              orderBy: { name: 'asc' },
            },
          }),
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: rows.map((p) => this.toDto(p as unknown as PrismaProduct)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(tenantId: string, dto: CreateProductDto) {
    if (dto.category_id) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.category_id, tenantId },
      });
      if (!category) throw new NotFoundException('Catégorie introuvable');
    }

    const created = await this.prisma.product.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        basePrice: dto.base_price,
        categoryId: dto.category_id,
        sku: dto.sku,
        imageUrl: dto.image_url,
        tags: dto.tags ?? [],
        allergens: dto.allergens ?? [],
        nutritionalInfo: {
          ...(dto.calories !== undefined && { calories: dto.calories }),
          ...(dto.proteins !== undefined && { proteins: dto.proteins }),
          ...(dto.carbs !== undefined && { carbs: dto.carbs }),
          ...(dto.fats !== undefined && { fats: dto.fats }),
          ...(dto.serving_size !== undefined && { serving_size: dto.serving_size }),
        },
        isAvailable: dto.is_available ?? true,
        isFeatured: dto.is_featured ?? false,
        sortOrder: dto.sort_order ?? 0,
      },
      include: { category: { select: { id: true, name: true } } },
    });
    return this.toDto(created as unknown as PrismaProduct);
  }

  async findOne(tenantId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
      include: {
        category: { select: { id: true, name: true } },
        optionGroups: {
          include: {
            options: { orderBy: [{ isDefault: 'desc' }, { name: 'asc' }] },
          },
          orderBy: { name: 'asc' },
        },
      },
    });
    if (!product) throw new NotFoundException('Produit introuvable');
    return this.toDto(product as unknown as PrismaProduct);
  }

  async update(tenantId: string, id: string, dto: UpdateProductDto) {
    await this.findOne(tenantId, id);

    if (dto.category_id) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.category_id, tenantId },
      });
      if (!category) throw new NotFoundException('Catégorie introuvable');
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.base_price !== undefined && { basePrice: dto.base_price }),
        ...(dto.category_id !== undefined && { categoryId: dto.category_id }),
        ...(dto.sku !== undefined && { sku: dto.sku }),
        ...(dto.image_url !== undefined && { imageUrl: dto.image_url }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        ...(dto.allergens !== undefined && { allergens: dto.allergens }),
        ...((dto.calories !== undefined || dto.proteins !== undefined || dto.carbs !== undefined || dto.fats !== undefined || dto.serving_size !== undefined) && {
          nutritionalInfo: {
            ...(dto.calories !== undefined && { calories: dto.calories }),
            ...(dto.proteins !== undefined && { proteins: dto.proteins }),
            ...(dto.carbs !== undefined && { carbs: dto.carbs }),
            ...(dto.fats !== undefined && { fats: dto.fats }),
            ...(dto.serving_size !== undefined && { serving_size: dto.serving_size }),
          },
        }),
        ...(dto.is_available !== undefined && { isAvailable: dto.is_available }),
        ...(dto.is_featured !== undefined && { isFeatured: dto.is_featured }),
        ...(dto.sort_order !== undefined && { sortOrder: dto.sort_order }),
      },
      include: { category: { select: { id: true, name: true } } },
    });
    return this.toDto(updated as unknown as PrismaProduct);
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    const deleted = await this.prisma.product.update({
      where: { id },
      data: { isAvailable: false },
      include: { category: { select: { id: true, name: true } } },
    });
    return this.toDto(deleted as unknown as PrismaProduct);
  }

  async toggleAvailability(tenantId: string, id: string, isAvailable: boolean) {
    await this.findOne(tenantId, id);
    return this.prisma.product.update({
      where: { id },
      data: { isAvailable },
      select: { id: true, name: true, isAvailable: true },
    });
  }
}
