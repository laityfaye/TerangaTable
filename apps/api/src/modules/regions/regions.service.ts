import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRegionDto } from './dto/create-region.dto';

@Injectable()
export class RegionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(includeInactive = false) {
    const rows = await this.prisma.region.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        countryCode: true,
        countryName: true,
        platformLabel: true,
        timezone: true,
        currencyCode: true,
        currencySymbol: true,
        locale: true,
        isActive: true,
        admin: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        _count: {
          select: {
            tenants: { where: { status: { in: ['active', 'trial'] }, slug: { not: '__platform__' } } },
            tenantRequests: { where: { status: 'pending' } },
          },
        },
      },
    });

    return rows.map(({ _count, countryCode, countryName, platformLabel, currencyCode, currencySymbol, isActive, admin, ...r }) => ({
      ...r,
      country_code: countryCode,
      country_name: countryName,
      platform_label: platformLabel,
      currency_code: currencyCode,
      currency_symbol: currencySymbol,
      is_active: isActive,
      tenants_count: _count.tenants,
      pending_requests_count: _count.tenantRequests,
      regional_admin: admin
        ? { id: admin.id, email: admin.email, first_name: admin.firstName, last_name: admin.lastName }
        : null,
    }));
  }

  async create(dto: CreateRegionDto) {
    const existing = await this.prisma.region.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException(`Le slug "${dto.slug}" est déjà utilisé`);

    const region = await this.prisma.region.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        countryCode: dto.country_code,
        countryName: (dto.country_name ?? '') as string,
        platformLabel: (dto.platform_label ?? `TérangaTable ${dto.name}`) as string,
        timezone: dto.timezone,
        currencyCode: dto.currency_code,
        currencySymbol: (dto.currency_symbol ?? '') as string,
        locale: dto.locale ?? 'fr',
        isActive: dto.is_active ?? true,
      },
    });

    return {
      id: region.id,
      name: region.name,
      slug: region.slug,
      country_code: region.countryCode,
      country_name: region.countryName,
      platform_label: region.platformLabel,
      timezone: region.timezone,
      currency_code: region.currencyCode,
      currency_symbol: region.currencySymbol,
      locale: region.locale,
      is_active: region.isActive,
      tenants_count: 0,
      pending_requests_count: 0,
      regional_admin: null,
    };
  }

  async toggle(id: string, is_active: boolean) {
    const region = await this.prisma.region.findUnique({ where: { id } });
    if (!region) throw new NotFoundException('Région introuvable');

    const updated = await this.prisma.region.update({
      where: { id },
      data: { isActive: is_active },
    });

    return { id: updated.id, is_active: updated.isActive };
  }

  async findBySlug(slug: string) {
    const region = await this.prisma.region.findUnique({
      where: { slug, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        countryCode: true,
        countryName: true,
        platformLabel: true,
        timezone: true,
        currencyCode: true,
        currencySymbol: true,
        locale: true,
        isActive: true,
        _count: {
          select: {
            tenants: { where: { status: { in: ['active', 'trial'] }, slug: { not: '__platform__' } } },
          },
        },
      },
    });

    if (!region) return null;

    const { _count, ...rest } = region;
    return { ...rest, activeTenantCount: _count.tenants };
  }
}
