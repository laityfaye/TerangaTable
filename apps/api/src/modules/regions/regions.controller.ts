import { Controller, Get, Post, Patch, Body, Param, Query, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RegionsService } from './regions.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { ToggleRegionDto } from './dto/toggle-region.dto';
import { AssignAdminDto } from './dto/assign-admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';

@ApiTags('Regions')
@Controller('regions')
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

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

  @Get(':slug')
  @ApiOperation({ summary: 'Détail d\'une région avec stats' })
  async findOne(@Param('slug') slug: string) {
    const region = await this.regionsService.findBySlug(slug);
    if (!region) throw new NotFoundException(`Région introuvable : ${slug}`);
    return region;
  }
}
