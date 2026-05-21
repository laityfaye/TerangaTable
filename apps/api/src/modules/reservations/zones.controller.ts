import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { TablesService } from './tables.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

interface TenantCtx { id: string }

@ApiTags('Zones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('zones')
export class ZonesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  @ApiOperation({ summary: 'Liste toutes les zones du restaurant' })
  findAll(@CurrentTenant() tenant: TenantCtx) {
    return this.tablesService.findAllZones(tenant.id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer une zone (Terrasse, Salle principale, Bar…)' })
  create(@CurrentTenant() tenant: TenantCtx, @Body() dto: CreateZoneDto) {
    return this.tablesService.createZone(tenant.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une zone' })
  update(
    @CurrentTenant() tenant: TenantCtx,
    @Param('id') id: string,
    @Body() dto: UpdateZoneDto,
  ) {
    return this.tablesService.updateZone(tenant.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une zone (délier les tables associées)' })
  @HttpCode(HttpStatus.OK)
  remove(@CurrentTenant() tenant: TenantCtx, @Param('id') id: string) {
    return this.tablesService.deleteZone(tenant.id, id);
  }
}
