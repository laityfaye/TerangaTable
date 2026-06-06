import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CategoriesService } from './categories/categories.service';
import { ProductsService } from './products/products.service';
import { OptionsService } from './options/options.service';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

// ── Prisma mock ───────────────────────────────────────────────────────────────

const mockCategory = {
  id: 'cat-1',
  tenantId: 'tenant-1',
  name: 'Plats principaux',
  description: null,
  imageUrl: null,
  sortOrder: 0,
  isActive: true,
  parentId: null,
  children: [],
  _count: { products: 0 },
};

const mockProduct = {
  id: 'prod-1',
  tenantId: 'tenant-1',
  name: 'Thiéboudienne',
  description: null,
  basePrice: '4500',
  categoryId: 'cat-1',
  sku: null,
  imageUrl: null,
  images: [],
  tags: [],
  allergens: [],
  nutritionalInfo: {},
  isAvailable: true,
  isFeatured: false,
  sortOrder: 0,
  createdAt: new Date(),
  category: { id: 'cat-1', name: 'Plats principaux' },
  optionGroups: [],
};

const mockGroup = {
  id: 'group-1',
  tenantId: 'tenant-1',
  productId: 'prod-1',
  name: 'Cuisson',
  type: 'single',
  isRequired: false,
  minSelect: 0,
  maxSelect: 1,
  options: [],
};

const mockOption = {
  id: 'opt-1',
  groupId: 'group-1',
  tenantId: 'tenant-1',
  name: 'Bien cuit',
  priceDelta: '0',
  isDefault: false,
  isAvailable: true,
};

function buildPrismaMock() {
  return {
    category: {
      findMany: jest.fn().mockResolvedValue([mockCategory]),
      findFirst: jest.fn().mockResolvedValue(mockCategory),
      findUnique: jest.fn().mockResolvedValue(mockCategory),
      create: jest.fn().mockResolvedValue(mockCategory),
      update: jest.fn().mockResolvedValue(mockCategory),
      delete: jest.fn().mockResolvedValue(mockCategory),
      count: jest.fn().mockResolvedValue(0),
    },
    product: {
      findMany: jest.fn().mockResolvedValue([mockProduct]),
      findFirst: jest.fn().mockResolvedValue(mockProduct),
      create: jest.fn().mockResolvedValue(mockProduct),
      update: jest.fn().mockResolvedValue(mockProduct),
      count: jest.fn().mockResolvedValue(1),
    },
    productOptionGroup: {
      findMany: jest.fn().mockResolvedValue([mockGroup]),
      findFirst: jest.fn().mockResolvedValue(mockGroup),
      create: jest.fn().mockResolvedValue(mockGroup),
      update: jest.fn().mockResolvedValue(mockGroup),
      delete: jest.fn().mockResolvedValue(mockGroup),
    },
    productOption: {
      findFirst: jest.fn().mockResolvedValue(mockOption),
      create: jest.fn().mockResolvedValue(mockOption),
      update: jest.fn().mockResolvedValue(mockOption),
      delete: jest.fn().mockResolvedValue(mockOption),
    },
  };
}

// ── S3 mock (MinIO) ───────────────────────────────────────────────────────────

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({}),
  })),
  PutObjectCommand: jest.fn().mockImplementation((params: unknown) => params),
}));

jest.mock('sharp', () => {
  const chain = {
    webp: jest.fn().mockReturnThis(),
    resize: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('fake-image')),
  };
  const fn = jest.fn().mockReturnValue(chain);
  // Nécessaire pour que `import sharp from 'sharp'` fonctionne en mode CommonJS avec ts-jest
  return { __esModule: true, default: fn };
});

// ── Test suites ───────────────────────────────────────────────────────────────

const TENANT = 'tenant-1';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: ReturnType<typeof buildPrismaMock>;

  beforeEach(async () => {
    prisma = buildPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(CategoriesService);
  });

  describe('findAll', () => {
    it('retourne la hiérarchie avec enfants imbriqués', async () => {
      const child = { ...mockCategory, id: 'cat-2', parentId: 'cat-1', children: [] };
      prisma.category.findMany.mockResolvedValue([mockCategory, child]);

      const result = await service.findAll(TENANT);

      expect(result).toHaveLength(1);
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].id).toBe('cat-2');
    });

    it('retourne un tableau vide quand aucune catégorie', async () => {
      prisma.category.findMany.mockResolvedValue([]);
      const result = await service.findAll(TENANT);
      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('crée une catégorie sans parent', async () => {
      const dto = { name: 'Desserts', sort_order: 1 };
      await service.create(TENANT, dto);
      expect(prisma.category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'Desserts', tenantId: TENANT }),
        }),
      );
    });

    it('lève NotFoundException si parent_id introuvable', async () => {
      prisma.category.findFirst.mockResolvedValue(null);
      await expect(
        service.create(TENANT, { name: 'Sub', parent_id: 'ghost-id' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('retourne la catégorie avec _count et enfants', async () => {
      prisma.category.findFirst.mockResolvedValue({ ...mockCategory, _count: { products: 3 } });
      const result = await service.findOne(TENANT, 'cat-1');
      expect(result._count.products).toBe(3);
    });

    it('lève NotFoundException si introuvable', async () => {
      prisma.category.findFirst.mockResolvedValue(null);
      await expect(service.findOne(TENANT, 'ghost')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('supprime une catégorie sans produits actifs', async () => {
      prisma.product.count.mockResolvedValue(0);
      await service.remove(TENANT, 'cat-1');
      expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: 'cat-1' } });
    });

    it('lève BadRequestException si produits actifs', async () => {
      prisma.product.count.mockResolvedValue(2);
      await expect(service.remove(TENANT, 'cat-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('reorder', () => {
    it('met à jour le sort_order de chaque catégorie', async () => {
      prisma.category.findMany.mockResolvedValue([
        { id: 'cat-1' },
        { id: 'cat-2' },
      ]);
      const dto = { items: [{ id: 'cat-1', sort_order: 0 }, { id: 'cat-2', sort_order: 1 }] };
      const result = await service.reorder(TENANT, dto);
      expect(prisma.category.update).toHaveBeenCalledTimes(2);
      expect(result.updated).toBe(2);
    });

    it('lève NotFoundException si un id est inconnu', async () => {
      prisma.category.findMany.mockResolvedValue([{ id: 'cat-1' }]);
      await expect(
        service.reorder(TENANT, { items: [{ id: 'cat-1', sort_order: 0 }, { id: 'ghost', sort_order: 1 }] }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: ReturnType<typeof buildPrismaMock>;

  beforeEach(async () => {
    prisma = buildPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(ProductsService);
  });

  describe('findAll', () => {
    it('retourne data + meta paginée', async () => {
      prisma.product.count.mockResolvedValue(1);
      const result = await service.findAll(TENANT, { page: 1, limit: 20 });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('filtre par category_id', async () => {
      await service.findAll(TENANT, { category_id: 'cat-1' });
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ categoryId: 'cat-1' }),
        }),
      );
    });
  });

  describe('toggleAvailability', () => {
    it('passe is_available à false (soft-delete)', async () => {
      prisma.product.update.mockResolvedValue({ id: 'prod-1', name: 'Thiéboudienne', isAvailable: false });
      const result = await service.toggleAvailability(TENANT, 'prod-1', false);
      expect(result.isAvailable).toBe(false);
      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isAvailable: false } }),
      );
    });

    it('lève NotFoundException si produit inconnu', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      await expect(
        service.toggleAvailability(TENANT, 'ghost', true),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('soft-delete : met isAvailable=false', async () => {
      await service.remove(TENANT, 'prod-1');
      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isAvailable: false } }),
      );
    });
  });
});

describe('OptionsService', () => {
  let service: OptionsService;
  let prisma: ReturnType<typeof buildPrismaMock>;

  beforeEach(async () => {
    prisma = buildPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OptionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(OptionsService);
  });

  it('findGroups retourne les groupes du produit', async () => {
    const result = await service.findGroups(TENANT, 'prod-1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('group-1');
  });

  it('createGroup lève NotFoundException si produit inconnu', async () => {
    prisma.product.findFirst.mockResolvedValue(null);
    await expect(
      service.createGroup(TENANT, 'ghost', { name: 'G', type: 'single' as never }),
    ).rejects.toThrow(NotFoundException);
  });

  it('removeOption lève NotFoundException si option inconnue', async () => {
    prisma.productOption.findFirst.mockResolvedValue(null);
    await expect(
      service.removeOption(TENANT, 'group-1', 'ghost-opt'),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('StorageService — upload image (mock MinIO)', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback: string) => fallback),
          },
        },
      ],
    }).compile();
    service = module.get(StorageService);
  });

  it('retourne url et thumbnailUrl', async () => {
    const fakeFile = {
      mimetype: 'image/jpeg',
      size: 1024,
      buffer: Buffer.from('fake'),
      originalname: 'test.jpg',
    } as Express.Multer.File;

    const result = await service.uploadImage(TENANT, fakeFile);
    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('thumbnailUrl');
    expect(result.url).toContain('tenant-1');
    expect(result.thumbnailUrl).toContain('_thumb');
  });

  it('lève BadRequestException pour MIME non supporté', async () => {
    const fakeFile = {
      mimetype: 'application/pdf',
      size: 1024,
      buffer: Buffer.from('fake'),
    } as Express.Multer.File;

    await expect(service.uploadImage(TENANT, fakeFile)).rejects.toThrow(BadRequestException);
  });

  it('lève BadRequestException si fichier > 5 MB', async () => {
    const fakeFile = {
      mimetype: 'image/jpeg',
      size: 6 * 1024 * 1024,
      buffer: Buffer.alloc(6 * 1024 * 1024),
    } as Express.Multer.File;

    await expect(service.uploadImage(TENANT, fakeFile)).rejects.toThrow(BadRequestException);
  });
});
