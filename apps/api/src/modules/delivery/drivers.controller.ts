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
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';

interface TenantCtx { id: string }

@ApiTags('Delivery - Drivers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, ModuleGuard)
@RequireModule('delivery')
@Controller('delivery/drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des livreurs' })
  findAll(@CurrentTenant() tenant: TenantCtx) {
    return this.driversService.findAll(tenant.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un livreur' })
  findOne(@CurrentTenant() tenant: TenantCtx, @Param('id') id: string) {
    return this.driversService.findOne(tenant.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Ajouter un livreur' })
  create(@CurrentTenant() tenant: TenantCtx, @Body() dto: CreateDriverDto) {
    return this.driversService.create(tenant.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un livreur' })
  update(
    @CurrentTenant() tenant: TenantCtx,
    @Param('id') id: string,
    @Body() dto: UpdateDriverDto,
  ) {
    return this.driversService.update(tenant.id, id, dto);
  }

  @Patch(':id/availability')
  @ApiOperation({ summary: 'Basculer la disponibilité d\'un livreur' })
  toggleAvailability(@CurrentTenant() tenant: TenantCtx, @Param('id') id: string) {
    return this.driversService.toggleAvailability(tenant.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un livreur' })
  @HttpCode(HttpStatus.OK)
  remove(@CurrentTenant() tenant: TenantCtx, @Param('id') id: string) {
    return this.driversService.remove(tenant.id, id);
  }
}
