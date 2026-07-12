import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { RespondReviewDto } from './dto/respond-review.dto';
import { ListReviewsDto } from './dto/list-reviews.dto';

const REVIEW_TOKEN_TTL = '30d';
const TERMINAL_SLUGS = ['served', 'delivered'];

interface ReviewTokenPayload {
  orderId: string;
  purpose: 'review';
}

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private get tokenSecret(): string {
    return this.config.get<string>('REVIEW_TOKEN_SECRET') ?? this.config.get<string>('JWT_SECRET')!;
  }

  // ── Jeton de dépôt d'avis ────────────────────────────────────────────────

  signReviewToken(orderId: string): string {
    const payload: ReviewTokenPayload = { orderId, purpose: 'review' };
    return this.jwt.sign(payload, { secret: this.tokenSecret, expiresIn: REVIEW_TOKEN_TTL });
  }

  private verifyReviewToken(token: string, orderId: string): void {
    let payload: ReviewTokenPayload;
    try {
      payload = this.jwt.verify<ReviewTokenPayload>(token, { secret: this.tokenSecret });
    } catch {
      throw new BadRequestException('Lien d\'avis invalide ou expiré');
    }
    if (payload.purpose !== 'review' || payload.orderId !== orderId) {
      throw new BadRequestException('Lien d\'avis invalide');
    }
  }

  // ── Dépôt public (lié à une commande terminée) ──────────────────────────

  async createFromOrder(orderId: string, dto: CreateReviewDto) {
    this.verifyReviewToken(dto.token, orderId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { workflowState: { select: { slug: true, isTerminal: true } } },
    });
    if (!order) throw new NotFoundException('Commande introuvable');

    const isTerminal = order.workflowState?.isTerminal || TERMINAL_SLUGS.includes(order.status);
    if (!isTerminal) {
      throw new BadRequestException('La commande doit être terminée avant de pouvoir être notée');
    }

    try {
      const review = await this.prisma.$transaction(async (tx) => {
        const created = await tx.review.create({
          data: {
            tenantId: order.tenantId,
            orderId: order.id,
            customerId: order.customerId,
            rating: dto.rating,
            comment: dto.comment ?? null,
          },
        });
        await this.recomputeTenantAggregates(tx, order.tenantId);
        return created;
      });
      return this.mapReview(review);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Cette commande a déjà été notée');
      }
      throw err;
    }
  }

  // ── Liste dashboard (tenant) ─────────────────────────────────────────────

  async findAll(tenantId: string, query: ListReviewsDto) {
    const { page = 1, limit = 20, status, rating } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = {
      tenantId,
      ...(status && { status }),
      ...(rating && { rating }),
    };

    const [reviews, total, tenant] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { firstName: true, lastName: true } }, order: { select: { orderNumber: true } } },
      }),
      this.prisma.review.count({ where }),
      this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { avgRating: true, reviewCount: true } }),
    ]);

    return {
      data: reviews.map((r) => this.mapReview(r)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        avg_rating: Number(tenant?.avgRating ?? 0),
        review_count: tenant?.reviewCount ?? 0,
      },
    };
  }

  // ── Réponse publique du restaurateur ─────────────────────────────────────

  async respond(tenantId: string, id: string, dto: RespondReviewDto) {
    const review = await this.prisma.review.findFirst({ where: { id, tenantId } });
    if (!review) throw new NotFoundException('Avis introuvable');

    const updated = await this.prisma.review.update({
      where: { id },
      data: { response: dto.response, respondedAt: new Date() },
    });
    return this.mapReview(updated);
  }

  // ── Lecture publique (marketplace / vitrine) ─────────────────────────────

  async findPublishedForTenant(tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: Prisma.ReviewWhereInput = { tenantId, status: 'published' };

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          rating: true,
          comment: true,
          response: true,
          respondedAt: true,
          createdAt: true,
          customer: { select: { firstName: true } },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      data: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        response: r.response,
        responded_at: r.respondedAt,
        created_at: r.createdAt,
        customer_first_name: r.customer?.firstName ?? null,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Signalement public ────────────────────────────────────────────────────

  async report(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Avis introuvable');

    const wasPublished = review.status === 'published';
    await this.prisma.$transaction(async (tx) => {
      await tx.review.update({
        where: { id },
        data: {
          reportCount: { increment: 1 },
          ...(wasPublished && { status: 'flagged' }),
        },
      });
      // Un avis flagged sort de la moyenne publique tant qu'il n'est pas
      // republié par le super-admin (cf. ReviewsController: le restaurateur
      // ne peut pas faire ça lui-même).
      if (wasPublished) await this.recomputeTenantAggregates(tx, review.tenantId);
    });
    return { reported: true };
  }

  // ── Modération plateforme (super-admin) ──────────────────────────────────

  async findModerationQueue(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: Prisma.ReviewWhereInput = { OR: [{ status: 'flagged' }, { reportCount: { gt: 0 } }] };

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { reportCount: 'desc' },
        include: {
          tenant: { select: { name: true, slug: true } },
          customer: { select: { firstName: true, lastName: true } },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      data: reviews.map((r) => ({ ...this.mapReview(r), tenant: r.tenant, report_count: r.reportCount })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async moderate(id: string, status: 'published' | 'hidden') {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Avis introuvable');

    const updated = await this.prisma.$transaction(async (tx) => {
      const r = await tx.review.update({
        where: { id },
        data: { status, ...(status === 'published' && { reportCount: 0 }) },
      });
      await this.recomputeTenantAggregates(tx, review.tenantId);
      return r;
    });
    return this.mapReview(updated);
  }

  // ── Agrégats tenant ───────────────────────────────────────────────────────

  private async recomputeTenantAggregates(tx: Prisma.TransactionClient, tenantId: string) {
    const agg = await tx.review.aggregate({
      where: { tenantId, status: 'published' },
      _avg: { rating: true },
      _count: true,
    });

    await tx.tenant.update({
      where: { id: tenantId },
      data: {
        avgRating: agg._avg.rating ?? 0,
        reviewCount: agg._count,
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapReview(r: any) {
    return {
      id: r.id,
      order_id: r.orderId,
      order_number: r.order?.orderNumber ?? null,
      customer: r.customer
        ? { first_name: r.customer.firstName, last_name: r.customer.lastName ?? null }
        : null,
      rating: r.rating,
      comment: r.comment ?? null,
      status: r.status,
      response: r.response ?? null,
      responded_at: r.respondedAt ?? null,
      report_count: r.reportCount,
      created_at: r.createdAt,
    };
  }
}
