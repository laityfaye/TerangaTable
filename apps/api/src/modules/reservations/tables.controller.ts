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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { TableAvailabilityDto } from './dto/table-availability.dto';

interface TenantCtx { id: string }

@ApiTags('Tables')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get('availability')
  @ApiOperation({ summary: 'Tables libres pour un créneau et nombre de couverts' })
  getAvailability(
    @CurrentTenant() tenant: TenantCtx,
    @Query() dto: TableAvailabilityDto,
  ) {
    return this.tablesService.getAvailability(tenant.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Liste toutes les tables (filtrable par zone)' })
  findAll(@CurrentTenant() tenant: TenantCtx, @Query('zone_id') zoneId?: string) {
    return this.tablesService.findAllTables(tenant.id, zoneId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une table' })
  findOne(@CurrentTenant() tenant: TenantCtx, @Param('id') id: string) {
    return this.tablesService.findOneTable(tenant.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer une table' })
  create(@CurrentTenant() tenant: TenantCtx, @Body() dto: CreateTableDto) {
    return this.tablesService.createTable(tenant.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une table (numéro, capacité, position…)' })
  update(
    @CurrentTenant() tenant: TenantCtx,
    @Param('id') id: string,
    @Body() dto: UpdateTableDto,
  ) {
    return this.tablesService.updateTable(tenant.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une table' })
  @HttpCode(HttpStatus.OK)
  remove(@CurrentTenant() tenant: TenantCtx, @Param('id') id: string) {
    return this.tablesService.deleteTable(tenant.id, id);
  }
}
