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
import { ModuleGuard } from '../../common/guards/module.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequireModule } from '../../common/decorators/require-permission.decorator';
import { ZonesService } from './zones.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

interface TenantCtx { id: string }

@ApiTags('Delivery - Zones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, ModuleGuard)
@RequireModule('delivery')
@Controller('delivery/zones')
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des zones de livraison' })
  findAll(@CurrentTenant() tenant: TenantCtx) {
    return this.zonesService.findAll(tenant.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une zone' })
  findOne(@CurrentTenant() tenant: TenantCtx, @Param('id') id: string) {
    return this.zonesService.findOne(tenant.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer une zone de livraison' })
  create(@CurrentTenant() tenant: TenantCtx, @Body() dto: CreateZoneDto) {
    return this.zonesService.create(tenant.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une zone' })
  update(
    @CurrentTenant() tenant: TenantCtx,
    @Param('id') id: string,
    @Body() dto: UpdateZoneDto,
  ) {
    return this.zonesService.update(tenant.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une zone' })
  @HttpCode(HttpStatus.OK)
  remove(@CurrentTenant() tenant: TenantCtx, @Param('id') id: string) {
    return this.zonesService.remove(tenant.id, id);
  }
}
