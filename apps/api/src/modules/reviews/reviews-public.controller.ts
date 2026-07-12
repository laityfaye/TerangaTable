import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

@ApiTags('Avis publics')
@Controller('public')
export class ReviewsPublicController {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get(':slug/reviews')
  @ApiOperation({ summary: 'Avis publiés d\'un restaurant (marketplace / vitrine)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findForSlug(
    @Param('slug') slug: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug }, select: { id: true } });
    if (!tenant) throw new NotFoundException(`Restaurant "${slug}" introuvable`);
    return this.reviewsService.findPublishedForTenant(
      tenant.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post('orders/:orderId/reviews')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Déposer un avis lié à une commande terminée (jeton signé requis)' })
  createForOrder(@Param('orderId') orderId: string, @Body() dto: CreateReviewDto) {
    return this.reviewsService.createFromOrder(orderId, dto);
  }

  @Post('reviews/:id/report')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Signaler un avis publié (mis en file de modération, pas de suppression immédiate)' })
  report(@Param('id') id: string) {
    return this.reviewsService.report(id);
  }
}
