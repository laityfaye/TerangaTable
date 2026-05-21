import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePublicReservationDto } from './dto/create-public-reservation.dto';
import { UpdateWebsiteSettingsDto } from './dto/update-website-settings.dto';

@Injectable()
export class WebsiteService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicData(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      include: {
        region: {
          select: {
            name: true,
            currencyCode: true,
            currencySymbol: true,
            locale: true,
            countryName: true,
          },
        },
        websiteSettings: true,
        tenantModules: {
          where: { isActive: true },
          include: { module: { select: { slug: true } } },
        },
      },
    });

    if (!tenant || tenant.status === 'deleted') {
      throw new NotFoundException('Restaurant introuvable');
    }

    const modules = tenant.tenantModules.map((tm) => tm.module.slug);

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
      region: tenant.region,
      settings: tenant.settings,
      website_settings: tenant.websiteSettings,
      modules,
    };
  }

  async getPublicMenu(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });

    if (!tenant || tenant.status === 'deleted') {
      throw new NotFoundException('Restaurant introuvable');
    }

    const categories = await this.prisma.category.findMany({
      where: { tenantId: tenant.id, isActive: true, parentId: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        products: {
          where: { isAvailable: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          select: {
            id: true,
            name: true,
            description: true,
            basePrice: true,
            imageUrl: true,
            images: true,
            tags: true,
            allergens: true,
            isFeatured: true,
            sortOrder: true,
          },
        },
      },
    });

    return categories.filter((c) => c.products.length > 0);
  }

  async getFeaturedProducts(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });

    if (!tenant || tenant.status === 'deleted') {
      throw new NotFoundException('Restaurant introuvable');
    }

    return this.prisma.product.findMany({
      where: { tenantId: tenant.id, isAvailable: true, isFeatured: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      take: 9,
      select: {
        id: true,
        name: true,
        description: true,
        basePrice: true,
        imageUrl: true,
        images: true,
        tags: true,
        allergens: true,
      },
    });
  }

  async createPublicReservation(slug: string, dto: CreatePublicReservationDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });

    if (!tenant || tenant.status === 'deleted') {
      throw new NotFoundException('Restaurant introuvable');
    }

    const reservedAt = new Date(`${dto.date}T${dto.time}`);

    const reservation = await this.prisma.reservation.create({
      data: {
        tenantId: tenant.id,
        customerName: dto.customer_name,
        customerEmail: dto.customer_email,
        customerPhone: dto.customer_phone,
        partySize: dto.party_size,
        reservedAt,
        notes: dto.notes,
        status: 'pending',
        source: 'website',
      },
      select: { id: true, status: true, reservedAt: true, partySize: true, customerName: true },
    });

    return reservation;
  }

  // ── Dashboard (authenticated) endpoints ────────────────────────────────────

  async getDashboardSettings(tenantId: string, tenantSlug: string) {
    const settings = await this.prisma.websiteSettings.upsert({
      where: { tenantId },
      create: { tenantId },
      update: {},
    });

    return this.formatSettings(settings, tenantSlug);
  }

  async updateDashboardSettings(
    tenantId: string,
    tenantSlug: string,
    dto: UpdateWebsiteSettingsDto,
  ) {
    const settings = await this.prisma.websiteSettings.upsert({
      where: { tenantId },
      create: { tenantId },
      update: {
        ...(dto.theme_id !== undefined && {
          theme: dto.theme_id === null
            ? { disconnect: true }
            : { connect: { id: dto.theme_id } },
        }),
        ...(dto.custom_domain !== undefined && { customDomain: dto.custom_domain }),
        ...(dto.is_published !== undefined && { isPublished: dto.is_published }),
        ...(dto.primary_color !== undefined && { primaryColor: dto.primary_color }),
        ...(dto.secondary_color !== undefined && { secondaryColor: dto.secondary_color }),
        ...(dto.logo_url !== undefined && { logoUrl: dto.logo_url }),
        ...(dto.favicon_url !== undefined && { faviconUrl: dto.favicon_url }),
        ...(dto.hero_image_url !== undefined && { heroImageUrl: dto.hero_image_url }),
        ...(dto.seo_title !== undefined && { seoTitle: dto.seo_title }),
        ...(dto.seo_description !== undefined && { seoDescription: dto.seo_description }),
        ...(dto.seo_keywords !== undefined && { seoKeywords: dto.seo_keywords }),
        ...(dto.google_analytics !== undefined && { googleAnalytics: dto.google_analytics }),
        ...(dto.sections_config !== undefined && { sectionsConfig: dto.sections_config as Prisma.InputJsonValue }),
        ...(dto.social_links !== undefined && { socialLinks: dto.social_links as Prisma.InputJsonValue }),
        ...(dto.font_heading !== undefined && { fontHeading: dto.font_heading }),
        ...(dto.font_body !== undefined && { fontBody: dto.font_body }),
      },
    });

    return this.formatSettings(settings, tenantSlug);
  }

  async getThemes() {
    const themes = await this.prisma.theme.findMany({
      where: { isActive: true },
      orderBy: [{ isPremium: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        previewUrl: true,
        isPremium: true,
        isActive: true,
        config: true,
      },
    });
    return themes.map((t) => ({
      id:          t.id,
      name:        t.name,
      slug:        t.slug,
      preview_url: t.previewUrl,
      is_premium:  t.isPremium,
      is_active:   t.isActive,
      config:      t.config,
    }));
  }

  async publishWebsite(tenantId: string, tenantSlug: string) {
    const settings = await this.prisma.websiteSettings.upsert({
      where: { tenantId },
      create: { tenantId, isPublished: true },
      update: { isPublished: true },
    });
    return this.formatSettings(settings, tenantSlug);
  }

  async unpublishWebsite(tenantId: string, tenantSlug: string) {
    const settings = await this.prisma.websiteSettings.upsert({
      where: { tenantId },
      create: { tenantId, isPublished: false },
      update: { isPublished: false },
    });
    return this.formatSettings(settings, tenantSlug);
  }

  async checkDomain(_tenantId: string, _domain: string) {
    // Domain verification not yet implemented — return pending status
    return { status: 'pending' as const, message: 'Vérification du domaine en cours' };
  }

  private formatSettings(
    s: {
      id: string;
      tenantId: string;
      themeId: string | null;
      customDomain: string | null;
      isPublished: boolean;
      primaryColor: string;
      secondaryColor: string;
      logoUrl: string | null;
      faviconUrl: string | null;
      heroImageUrl: string | null;
      seoTitle: string | null;
      seoDescription: string | null;
      seoKeywords: string | null;
      googleAnalytics: string | null;
      sectionsConfig: unknown;
      socialLinks: unknown;
      fontHeading: string;
      fontBody: string;
    },
    tenantSlug: string,
  ) {
    return {
      id:               s.id,
      tenant_id:        s.tenantId,
      tenant_slug:      tenantSlug,
      theme_id:         s.themeId,
      custom_domain:    s.customDomain,
      domain_status:    null,
      is_published:     s.isPublished,
      is_maintenance:   false,
      primary_color:    s.primaryColor,
      secondary_color:  s.secondaryColor,
      logo_url:         s.logoUrl,
      favicon_url:      s.faviconUrl,
      hero_image_url:   s.heroImageUrl,
      seo_title:        s.seoTitle,
      seo_description:  s.seoDescription,
      seo_keywords:     s.seoKeywords,
      google_analytics: s.googleAnalytics,
      sections_config:  s.sectionsConfig ?? {},
      social_links:     s.socialLinks ?? {},
      font_heading:     s.fontHeading,
      font_body:        s.fontBody,
    };
  }

  async getAllActiveSlugs(): Promise<string[]> {
    const tenants = await this.prisma.tenant.findMany({
      where: {
        status: { in: ['active', 'trial'] },
        websiteSettings: { is: { isPublished: true } },
      },
      select: { slug: true },
    });
    return tenants.map((t) => t.slug);
  }
}
