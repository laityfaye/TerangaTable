import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ReorderCategoryDto } from './dto/reorder-category.dto';

type PrismaCategory = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  parentId: string | null;
  _count?: { products: number };
};

export interface CategoryDto {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  parent_id: string | null;
  product_count: number;
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  private toDto(cat: PrismaCategory): CategoryDto {
    return {
      id: cat.id,
      name: cat.name,
      description: cat.description,
      image_url: cat.imageUrl,
      sort_order: cat.sortOrder,
      is_active: cat.isActive,
      parent_id: cat.parentId,
      product_count: cat._count?.products ?? 0,
    };
  }

  async findAll(tenantId: string): Promise<CategoryDto[]> {
    const categories = await this.prisma.category.findMany({
      where: { tenantId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: true } } },
    });

    return categories.map((cat) => this.toDto(cat));
  }

  async create(tenantId: string, dto: CreateCategoryDto) {
    if (dto.parent_id) {
      const parent = await this.prisma.category.findFirst({
        where: { id: dto.parent_id, tenantId },
      });
      if (!parent) throw new NotFoundException('Catégorie parente introuvable');
    }

    const cat = await this.prisma.category.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        imageUrl: dto.image_url,
        parentId: dto.parent_id,
        sortOrder: dto.sort_order ?? 0,
        isActive: dto.is_active ?? true,
      },
    });
    return this.toDto(cat);
  }

  async findOne(tenantId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { products: true } } },
    });
    if (!category) throw new NotFoundException('Catégorie introuvable');
    return this.toDto(category);
  }

  async update(tenantId: string, id: string, dto: UpdateCategoryDto) {
    await this.prisma.category.findFirstOrThrow({ where: { id, tenantId } }).catch(() => {
      throw new NotFoundException('Catégorie introuvable');
    });

    if (dto.parent_id) {
      if (dto.parent_id === id) {
        throw new BadRequestException('Une catégorie ne peut pas être son propre parent');
      }
      const parent = await this.prisma.category.findFirst({
        where: { id: dto.parent_id, tenantId },
      });
      if (!parent) throw new NotFoundException('Catégorie parente introuvable');
    }

    const cat = await this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.image_url !== undefined && { imageUrl: dto.image_url }),
        ...(dto.parent_id !== undefined && { parentId: dto.parent_id }),
        ...(dto.sort_order !== undefined && { sortOrder: dto.sort_order }),
        ...(dto.is_active !== undefined && { isActive: dto.is_active }),
      },
    });
    return this.toDto(cat);
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    const activeProducts = await this.prisma.product.count({
      where: { tenantId, categoryId: id, isAvailable: true },
    });

    if (activeProducts > 0) {
      throw new BadRequestException(
        `Impossible de supprimer : ${activeProducts} produit(s) actif(s) dans cette catégorie`,
      );
    }

    return this.prisma.category.delete({ where: { id } });
  }

  async reorder(tenantId: string, dto: ReorderCategoryDto) {
    const ids = dto.items.map((i) => i.id);

    const existing = await this.prisma.category.findMany({
      where: { id: { in: ids }, tenantId },
      select: { id: true },
    });

    if (existing.length !== ids.length) {
      throw new NotFoundException('Une ou plusieurs catégories sont introuvables');
    }

    await Promise.all(
      dto.items.map((item) =>
        this.prisma.category.update({
          where: { id: item.id },
          data: { sortOrder: item.sort_order },
        }),
      ),
    );

    return { updated: dto.items.length };
  }
}
