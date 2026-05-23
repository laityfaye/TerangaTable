import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@terangatable/database';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePublicReservationDto } from './dto/create-public-reservation.dto';
import { CreatePublicOrderDto } from './dto/create-public-order.dto';
import { UpdateWebsiteSettingsDto } from './dto/update-website-settings.dto';
import { OrdersGateway } from '../orders/orders.gateway';

// ── Content config shape ──────────────────────────────────────────────────────

export interface ContentConfig {
  description?:    string | null;
  about_text?:     string | null;
  about_chef?:     string | null;
  about_image_url?: string | null;
  gallery_images?: string[];
  phone?:          string | null;
  address?:        string | null;
  email?:          string | null;
}

// ── Prisma WebsiteSettings shape (includes new fields) ────────────────────────

type WsRecord = {
  id:             string;
  tenantId:       string;
  themeId:        string | null;
  customDomain:   string | null;
  isPublished:    boolean;
  isMaintenance:  boolean;
  primaryColor:   string;
  secondaryColor: string;
  logoUrl:        string | null;
  faviconUrl:     string | null;
  heroImageUrl:   string | null;
  seoTitle:       string | null;
  seoDescription: string | null;
  seoKeywords:    string | null;
  googleAnalytics: string | null;
  sectionsConfig: unknown;
  socialLinks:    unknown;
  fontHeading:    string;
  fontBody:       string;
  contentConfig:  unknown;
};

@Injectable()
export class WebsiteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersGateway: OrdersGateway,
  ) {}

  // ── Public endpoints ───────────────────────────────────────────────────────

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
    const ws = tenant.websiteSettings as WsRecord | null;

    // Build the settings object merging tenant.settings (legacy) + contentConfig
    const legacy = (typeof tenant.settings === 'object' && tenant.settings !== null
      ? tenant.settings
      : {}) as Record<string, unknown>;

    const cc = (ws?.contentConfig ?? {}) as ContentConfig;

    // Read operational settings (opening_hours) from the flat Setting table
    const settingRows = await this.prisma.setting.findMany({
      where: { tenantId: tenant.id, key: { in: ['opening_hours'] } },
      select: { key: true, value: true },
    });
    const settingMap: Record<string, unknown> = {};
    for (const row of settingRows) settingMap[row.key] = row.value;

    // Normalise opening_hours format: { monday: { open, close, closed } } → { monday: { open, close } | 'closed' }
    let openingHours: Record<string, { open: string; close: string } | 'closed'> | undefined;
    if (settingMap['opening_hours'] && typeof settingMap['opening_hours'] === 'object') {
      const raw = settingMap['opening_hours'] as Record<string, { open: string; close: string; closed?: boolean }>;
      openingHours = {};
      for (const [day, val] of Object.entries(raw)) {
        if (!val || val.closed) {
          openingHours[day] = 'closed';
        } else {
          openingHours[day] = { open: val.open, close: val.close };
        }
      }
    }

    const settings = {
      ...legacy,
      // operational settings from flat Setting table
      ...(openingHours && { opening_hours: openingHours }),
      // vitrine-specific content from contentConfig (overrides legacy)
      ...(cc.description    != null && { description:    cc.description }),
      ...(cc.about_text     != null && { about_text:     cc.about_text }),
      ...(cc.about_chef     != null && { about_chef:     cc.about_chef }),
      ...(cc.about_image_url != null && { about_image:   cc.about_image_url }),
      ...(cc.gallery_images != null && { gallery_images: cc.gallery_images }),
      ...(cc.phone    != null && { phone:   cc.phone }),
      ...(cc.address  != null && { address: cc.address }),
      ...(cc.email    != null && { email:   cc.email }),
    };

    return {
      id:               tenant.id,
      name:             tenant.name,
      slug:             tenant.slug,
      status:           tenant.status,
      region:           tenant.region,
      settings,
      website_settings: ws ? this.formatSettings(ws, tenant.slug) : null,
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
        tenantId:       tenant.id,
        customerName:   dto.customer_name,
        customerEmail:  dto.customer_email,
        customerPhone:  dto.customer_phone,
        partySize:      dto.party_size,
        reservedAt,
        notes:          dto.notes,
        status:         'pending',
        source:         'website',
      },
      select: { id: true, status: true, reservedAt: true, partySize: true, customerName: true },
    });

    return reservation;
  }

  async createPublicOrder(slug: string, dto: CreatePublicOrderDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });

    if (!tenant || tenant.status === 'deleted') {
      throw new NotFoundException('Restaurant introuvable');
    }

    // Fetch products and validate availability
    const products = await this.prisma.product.findMany({
      where: { id: { in: dto.items.map((i) => i.product_id) }, tenantId: tenant.id },
      select: { id: true, name: true, basePrice: true, isAvailable: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));
    for (const item of dto.items) {
      const product = productMap.get(item.product_id);
      if (!product) throw new NotFoundException(`Produit introuvable : ${item.product_id}`);
      if (!product.isAvailable) throw new BadRequestException(`Produit indisponible : ${product.name}`);
    }

    // Résoudre le numéro de table en ID (QR code dine_in)
    let tableId: string | null = null;
    let tableNumber: string | null = null;
    if (dto.table_number) {
      const table = await this.prisma.table.findFirst({
        where: { tenantId: tenant.id, number: dto.table_number, isActive: true },
        select: { id: true, number: true },
      });
      if (table) {
        tableId = table.id;
        tableNumber = table.number;
      }
    }

    // Find initial workflow state (optional — public orders may not have one)
    const workflow = await this.prisma.workflowDefinition.findFirst({
      where: { tenantId: tenant.id, entityType: 'order', isDefault: true },
      include: { states: { where: { isInitial: true }, take: 1 } },
    });
    const initialStateId = workflow?.states[0]?.id ?? null;

    // Generate order number
    const year = new Date().getFullYear();
    const prefix = `ORD-${year}-`;
    const lastOrder = await this.prisma.order.findFirst({
      where: { tenantId: tenant.id, orderNumber: { startsWith: prefix } },
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    });
    let seq = 1;
    if (lastOrder) {
      const lastSeq = parseInt(lastOrder.orderNumber.split('-')[2] ?? '0', 10);
      if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }
    const orderNumber = `${prefix}${String(seq).padStart(4, '0')}`;

    // Compute totals
    let subtotal = 0;
    const itemsData = dto.items.map((item) => {
      const product = productMap.get(item.product_id)!;
      const unitPrice = parseFloat(product.basePrice.toString());
      const lineTotal = parseFloat((unitPrice * item.quantity).toFixed(2));
      subtotal = parseFloat((subtotal + lineTotal).toFixed(2));
      return {
        tenantId:    tenant.id,
        productId:   item.product_id,
        productName: product.name,
        unitPrice:   unitPrice.toString(),
        quantity:    item.quantity,
        options:     [] as object[],
        lineTotal:   lineTotal.toString(),
        notes:       item.notes ?? null,
      };
    });

    // Build customer notes (includes customer name/phone since we have no customer record)
    const customerNote = [
      dto.customer_name ? `Client : ${dto.customer_name}` : null,
      dto.customer_phone ? `Tél : ${dto.customer_phone}` : null,
      tableNumber ? `Table : ${tableNumber}` : (dto.table_number ? `Table : ${dto.table_number}` : null),
      dto.notes ? `Note : ${dto.notes}` : null,
    ].filter(Boolean).join(' | ');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order = await (this.prisma as any).order.create({
      data: {
        tenantId:        tenant.id,
        orderNumber,
        type:            dto.type,
        workflowStateId: initialStateId,
        tableId,
        agentId:         null,
        subtotal:        subtotal.toString(),
        discountAmount:  '0',
        total:           subtotal.toString(),
        notes:           customerNote,
        items: { create: itemsData },
      },
      include: {
        workflowState: { select: { id: true, name: true, color: true, slug: true } },
        table: { select: { id: true, number: true } },
        items: {
          select: {
            id: true,
            productName: true,
            quantity: true,
            unitPrice: true,
            lineTotal: true,
            options: true,
            notes: true,
          },
        },
      },
    });

    // Map to dashboard Order format
    const mapped = {
      id:               order.id,
      order_number:     order.orderNumber,
      type:             order.type,
      status:           order.status ?? null,
      workflow_state:   order.workflowState ?? null,
      table:            order.table ?? null,
      customer:         null,
      agent:            null,
      subtotal:         order.subtotal,
      tax_amount:       order.taxAmount ?? null,
      discount_amount:  order.discountAmount,
      total:            order.total,
      notes:            order.notes ?? null,
      delivery_address: null,
      paid_at:          null,
      created_at:       order.createdAt,
      items:            order.items ?? [],
      payments:         [],
    };

    // Emit real-time event so the dashboard updates instantly
    this.ordersGateway.emitOrderCreated(tenant.id, mapped);

    return {
      id:           mapped.id,
      order_number: mapped.order_number,
      total:        mapped.total,
      type:         mapped.type,
      created_at:   mapped.created_at,
    };
  }

  // ── Dashboard (authenticated) endpoints ────────────────────────────────────

  async getDashboardSettings(tenantId: string, tenantSlug: string) {
    const settings = await this.prisma.websiteSettings.upsert({
      where:  { tenantId },
      create: { tenantId },
      update: {},
    });

    return this.formatSettings(settings as WsRecord, tenantSlug);
  }

  async updateDashboardSettings(
    tenantId: string,
    tenantSlug: string,
    dto: UpdateWebsiteSettingsDto,
  ) {
    const settings = await this.prisma.websiteSettings.upsert({
      where:  { tenantId },
      create: { tenantId },
      update: {
        ...(dto.theme_id !== undefined && {
          theme: dto.theme_id === null
            ? { disconnect: true }
            : { connect: { id: dto.theme_id } },
        }),
        ...(dto.custom_domain  !== undefined && { customDomain:    dto.custom_domain }),
        ...(dto.is_published   !== undefined && { isPublished:     dto.is_published }),
        ...(dto.is_maintenance !== undefined && { isMaintenance:   dto.is_maintenance }),
        ...(dto.primary_color  !== undefined && { primaryColor:    dto.primary_color }),
        ...(dto.secondary_color !== undefined && { secondaryColor: dto.secondary_color }),
        ...(dto.logo_url       !== undefined && { logoUrl:         dto.logo_url }),
        ...(dto.favicon_url    !== undefined && { faviconUrl:      dto.favicon_url }),
        ...(dto.hero_image_url !== undefined && { heroImageUrl:    dto.hero_image_url }),
        ...(dto.seo_title      !== undefined && { seoTitle:        dto.seo_title }),
        ...(dto.seo_description !== undefined && { seoDescription: dto.seo_description }),
        ...(dto.seo_keywords   !== undefined && { seoKeywords:     dto.seo_keywords }),
        ...(dto.google_analytics !== undefined && { googleAnalytics: dto.google_analytics }),
        ...(dto.sections_config !== undefined && { sectionsConfig: dto.sections_config as Prisma.InputJsonValue }),
        ...(dto.social_links   !== undefined && { socialLinks:     dto.social_links as Prisma.InputJsonValue }),
        ...(dto.font_heading   !== undefined && { fontHeading:     dto.font_heading }),
        ...(dto.font_body      !== undefined && { fontBody:        dto.font_body }),
        ...(dto.content_config !== undefined && { contentConfig:   dto.content_config as Prisma.InputJsonValue }),
      },
    });

    return this.formatSettings(settings as WsRecord, tenantSlug);
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
      where:  { tenantId },
      create: { tenantId, isPublished: true },
      update: { isPublished: true },
    });
    return this.formatSettings(settings as WsRecord, tenantSlug);
  }

  async unpublishWebsite(tenantId: string, tenantSlug: string) {
    const settings = await this.prisma.websiteSettings.upsert({
      where:  { tenantId },
      create: { tenantId, isPublished: false },
      update: { isPublished: false },
    });
    return this.formatSettings(settings as WsRecord, tenantSlug);
  }

  async checkDomain(_tenantId: string, _domain: string) {
    return { status: 'pending' as const, message: 'Vérification du domaine en cours' };
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private formatSettings(s: WsRecord, tenantSlug: string) {
    return {
      id:               s.id,
      tenant_id:        s.tenantId,
      tenant_slug:      tenantSlug,
      theme_id:         s.themeId,
      custom_domain:    s.customDomain,
      domain_status:    null,
      is_published:     s.isPublished,
      is_maintenance:   s.isMaintenance ?? false,
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
      content_config:   (s.contentConfig ?? {}) as ContentConfig,
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
