import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { CreateTenantRequestDto } from './dto/create-tenant-request.dto';
import { ReviewTenantRequestDto } from './dto/review-tenant-request.dto';
import { UpdateTenantStatusDto } from './dto/update-tenant-status.dto';
import { UpdateTenantPlanDto } from './dto/update-tenant-plan.dto';
import { ListTenantsDto } from './dto/list-tenants.dto';
import { InviteAdminDto } from './dto/invite-admin.dto';
import { ToggleAdminDto } from './dto/toggle-admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { ReviewsService } from '../reviews/reviews.service';

interface AuthenticatedRequest {
  user: { id: string; tenantId: string | null; roles: string[]; regionSlug?: string | null };
}

@ApiTags('Tenants')
@Controller()
export class TenantsController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly reviewsService: ReviewsService,
  ) {}

  // ── Tenants ───────────────────────────────────────────────────────────────

  @Get('tenants')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Liste paginée des tenants (SuperAdmin ou RegionalAdmin)' })
  findAll(@Request() req: AuthenticatedRequest, @Query() dto: ListTenantsDto) {
    if (req.user.roles.includes('regional_admin')) {
      return this.tenantsService.findAllByRegionSlug(req.user.regionSlug ?? undefined, dto);
    }
    if (req.user.roles.includes('super_admin')) {
      return this.tenantsService.findAll(dto);
    }
    throw new ForbiddenException('Accès réservé aux administrateurs');
  }

  @Post('tenants')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un tenant manuellement (SuperAdmin)' })
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @Patch('tenants/:id/status')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Suspendre ou réactiver un tenant (SuperAdmin)' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateTenantStatusDto) {
    return this.tenantsService.updateStatus(id, dto);
  }

  @Patch('tenants/:id/plan')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Changer le plan d\'un tenant — upgrade ou downgrade (SuperAdmin)' })
  updatePlan(@Param('id') id: string, @Body() dto: UpdateTenantPlanDto) {
    return this.tenantsService.updatePlan(id, dto.planId);
  }

  @Delete('tenants/:id')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer (soft-delete) un tenant (SuperAdmin)' })
  deleteTenant(@Param('id') id: string) {
    return this.tenantsService.deleteTenant(id);
  }

  @Delete('tenants/:id/purge')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Purger définitivement un tenant déjà supprimé (SuperAdmin)' })
  purgeTenant(@Param('id') id: string) {
    return this.tenantsService.purgeTenant(id);
  }

  // ── Dashboard Stats ───────────────────────────────────────────────────────

  @Get('super-admin/stats')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Stats globales pour le tableau de bord (SuperAdmin)' })
  getDashboardStats() {
    return this.tenantsService.getDashboardStats();
  }

  // ── Tenant Requests ───────────────────────────────────────────────────────

  @Get('tenant-requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Liste des demandes (SuperAdmin ou RegionalAdmin)' })
  findAllRequests(@Request() req: AuthenticatedRequest, @Query('regionId') regionId?: string) {
    if (req.user.roles.includes('regional_admin')) {
      return this.tenantsService.findAllRequestsByRegionSlug(req.user.regionSlug ?? undefined);
    }
    if (req.user.roles.includes('super_admin')) {
      return this.tenantsService.findAllRequests(regionId);
    }
    throw new ForbiddenException('Accès réservé aux administrateurs');
  }

  @Post('tenant-requests')
  @ApiOperation({ summary: 'Soumettre une demande d\'inscription (public)' })
  createRequest(@Body() dto: CreateTenantRequestDto) {
    return this.tenantsService.createRequest(dto);
  }

  @Delete('tenant-requests/:id')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer définitivement une demande rejetée (SuperAdmin)' })
  deleteRequest(@Param('id') id: string) {
    return this.tenantsService.deleteRequest(id);
  }

  @Patch('tenant-requests/:id/review')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approuver ou rejeter une demande (SuperAdmin)' })
  reviewRequest(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: ReviewTenantRequestDto,
  ) {
    return this.tenantsService.reviewRequest(id, req.user.id, dto);
  }

  // ── Modules plateforme ────────────────────────────────────────────────────

  @Get('modules')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lister les modules plateforme (SuperAdmin)' })
  findAllModules() {
    return this.tenantsService.findAllModules();
  }

  @Patch('modules/:id')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activer / désactiver un module plateforme (SuperAdmin)' })
  toggleModule(@Param('id') id: string, @Body() body: { is_active: boolean }) {
    return this.tenantsService.toggleModule(id, body.is_active);
  }

  // ── Modération des avis (cross-tenant) ────────────────────────────────────
  // Le restaurateur ne peut jamais masquer/supprimer un avis reçu (cf.
  // ReviewsController) — seul le super-admin peut le faire, via cette file
  // d'attente alimentée par les signalements clients.

  @Get('reviews/moderation')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'File de modération des avis signalés (SuperAdmin)' })
  findReviewModerationQueue(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.reviewsService.findModerationQueue(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Patch('reviews/:id/status')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Masquer un avis abusif ou lever un signalement (SuperAdmin)' })
  moderateReview(@Param('id') id: string, @Body() body: { status: 'published' | 'hidden' }) {
    return this.reviewsService.moderate(id, body.status);
  }

  // ── Admins plateforme ─────────────────────────────────────────────────────

  @Get('admins')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lister les admins plateforme (SuperAdmin)' })
  findAllAdmins(
    @Query('role') role?: string,
    @Query('region') region?: string,
    @Query('search') search?: string,
  ) {
    return this.tenantsService.findAllAdmins({ role, region, search });
  }

  @Post('admins/invite')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Inviter un nouvel admin plateforme (SuperAdmin)' })
  inviteAdmin(@Body() dto: InviteAdminDto) {
    return this.tenantsService.inviteAdmin(dto);
  }

  @Patch('admins/:id')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activer / désactiver un admin plateforme (SuperAdmin)' })
  toggleAdmin(@Param('id') id: string, @Body() dto: ToggleAdminDto) {
    return this.tenantsService.toggleAdmin(id, dto);
  }

  @Delete('admins/:id')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer définitivement un admin plateforme (SuperAdmin)' })
  deleteAdmin(@Param('id') id: string) {
    return this.tenantsService.deleteAdmin(id);
  }
}
