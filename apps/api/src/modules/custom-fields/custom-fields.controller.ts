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
import { CustomFieldsService } from './custom-fields.service';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';
import { UpdateCustomFieldDto } from './dto/update-custom-field.dto';
import { ListCustomFieldsDto } from './dto/list-custom-fields.dto';
import { UpsertCustomFieldValueDto } from './dto/upsert-custom-field-value.dto';
import { ReorderCustomFieldsDto } from './dto/reorder-custom-fields.dto';

interface TenantCtx { id: string }

@ApiTags('Custom Fields')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('custom-fields')
export class CustomFieldsController {
  constructor(private readonly customFieldsService: CustomFieldsService) {}

  @Get()
  @ApiOperation({ summary: 'Liste les champs personnalisés (filtrables par entity_type)' })
  findAll(@CurrentTenant() tenant: TenantCtx, @Query() dto: ListCustomFieldsDto) {
    return this.customFieldsService.findAll(tenant.id, dto);
  }

  @Get('values/:entityType/:entityId')
  @ApiOperation({ summary: "Valeurs des champs d'une entité" })
  getValues(
    @CurrentTenant() tenant: TenantCtx,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.customFieldsService.getValues(tenant.id, entityType, entityId);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'un champ personnalisé" })
  findOne(@CurrentTenant() tenant: TenantCtx, @Param('id') id: string) {
    return this.customFieldsService.findOne(tenant.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un champ personnalisé' })
  create(@CurrentTenant() tenant: TenantCtx, @Body() dto: CreateCustomFieldDto) {
    return this.customFieldsService.create(tenant.id, dto);
  }

  @Post('values')
  @ApiOperation({ summary: 'Créer ou mettre à jour une valeur' })
  upsertValue(@CurrentTenant() tenant: TenantCtx, @Body() dto: UpsertCustomFieldValueDto) {
    return this.customFieldsService.upsertValue(tenant.id, dto);
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Réordonner les champs' })
  reorder(@CurrentTenant() tenant: TenantCtx, @Body() dto: ReorderCustomFieldsDto) {
    return this.customFieldsService.reorder(tenant.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un champ personnalisé' })
  update(
    @CurrentTenant() tenant: TenantCtx,
    @Param('id') id: string,
    @Body() dto: UpdateCustomFieldDto,
  ) {
    return this.customFieldsService.update(tenant.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un champ personnalisé (et ses valeurs)' })
  @HttpCode(HttpStatus.OK)
  remove(@CurrentTenant() tenant: TenantCtx, @Param('id') id: string) {
    return this.customFieldsService.remove(tenant.id, id);
  }
}
