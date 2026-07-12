import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireModule } from '../../common/decorators/require-permission.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { ReviewsService } from './reviews.service';
import { RespondReviewDto } from './dto/respond-review.dto';
import { ListReviewsDto } from './dto/list-reviews.dto';

interface TenantCtx { id: string }

@ApiTags('Reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, ModuleGuard, RolesGuard)
@RequireModule('reviews')
@Roles('manager', 'restaurant_owner', 'super_admin')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'Liste paginée des avis du restaurant, avec filtres' })
  findAll(@CurrentTenant() tenant: TenantCtx, @Query() query: ListReviewsDto) {
    return this.reviewsService.findAll(tenant.id, query);
  }

  @Post(':id/respond')
  @ApiOperation({ summary: 'Répondre publiquement à un avis (aucune suppression/masquage possible ici)' })
  respond(
    @CurrentTenant() tenant: TenantCtx,
    @Param('id') id: string,
    @Body() dto: RespondReviewDto,
  ) {
    return this.reviewsService.respond(tenant.id, id, dto);
  }
}
