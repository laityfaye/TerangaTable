import { Controller, Get, Post, Patch, Body, Param, Query, Request, NotFoundException, ForbiddenException, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RegionsService } from './regions.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { ToggleRegionDto } from './dto/toggle-region.dto';
import { AssignAdminDto } from './dto/assign-admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';

interface AuthenticatedRequest {
  user: { id: string; tenantId: string | null; roles: string[]; regionSlug?: string | null };
}

@ApiTags('Regions')
@Controller('regions')
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  private assertRegionAccess(req: AuthenticatedRequest, slug: string): void {
    if (req.user.roles.includes('super_admin')) return;
    if (req.user.roles.includes('regional_admin') && req.user.regionSlug === slug) return;
    throw new ForbiddenException('Accès limité à votre région');
  }

  @Get()
  @ApiOperation({ summary: 'Liste des régions (public: actives seulement, super-admin: toutes)' })
  async findAll(@Query('all') all?: string) {
    return this.regionsService.findAll(all === 'true');
  }

  @Post()
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer une région (SuperAdmin)' })
  async create(@Body() dto: CreateRegionDto) {
    return this.regionsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activer / désactiver une région (SuperAdmin)' })
  async toggle(@Param('id') id: string, @Body() dto: ToggleRegionDto) {
    return this.regionsService.toggle(id, dto.is_active);
  }

  @Patch(':id/assign-admin')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assigner ou retirer un admin régional (SuperAdmin)' })
  async assignAdmin(@Param('id') id: string, @Body() dto: AssignAdminDto) {
    return this.regionsService.assignAdmin(id, dto.userId);
  }

  @Get(':slug/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Statistiques d\'une région (SuperAdmin ou RegionalAdmin de cette région)' })
  async getStats(@Param('slug') slug: string, @Request() req: AuthenticatedRequest) {
    this.assertRegionAccess(req, slug);
    return this.regionsService.getStats(slug);
  }

  @Get(':slug/tenants-history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Historique 6 mois des tenants actifs (SuperAdmin ou RegionalAdmin de cette région)' })
  async getTenantsHistory(@Param('slug') slug: string, @Request() req: AuthenticatedRequest) {
    this.assertRegionAccess(req, slug);
    return this.regionsService.getTenantsHistory(slug);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Détail d\'une région avec stats' })
  async findOne(@Param('slug') slug: string) {
    const region = await this.regionsService.findBySlug(slug);
    if (!region) throw new NotFoundException(`Région introuvable : ${slug}`);
    return region;
  }
}
