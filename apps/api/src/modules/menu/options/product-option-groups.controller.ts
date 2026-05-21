import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { OptionsService } from './options.service';
import { CreateOptionGroupDto } from './dto/create-option-group.dto';
import { UpdateOptionGroupDto } from './dto/update-option-group.dto';
import { CreateOptionDto } from './dto/create-option.dto';

interface TenantCtx { id: string }

@ApiTags('Menu — Options')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('products/:productId/option-groups')
export class ProductOptionGroupsController {
  constructor(private readonly optionsService: OptionsService) {}

  @Get()
  @ApiOperation({ summary: 'Groupes d\'options d\'un produit' })
  findGroups(
    @CurrentTenant() tenant: TenantCtx,
    @Param('productId') productId: string,
  ) {
    return this.optionsService.findGroups(tenant.id, productId);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un groupe d\'options' })
  createGroup(
    @CurrentTenant() tenant: TenantCtx,
    @Param('productId') productId: string,
    @Body() dto: CreateOptionGroupDto,
  ) {
    return this.optionsService.createGroup(tenant.id, productId, dto);
  }

  @Patch(':groupId')
  @ApiOperation({ summary: 'Modifier un groupe d\'options' })
  updateGroup(
    @CurrentTenant() tenant: TenantCtx,
    @Param('productId') productId: string,
    @Param('groupId') groupId: string,
    @Body() dto: UpdateOptionGroupDto,
  ) {
    return this.optionsService.updateGroup(tenant.id, productId, groupId, dto);
  }

  @Delete(':groupId')
  @ApiOperation({ summary: 'Supprimer un groupe d\'options (cascade options)' })
  removeGroup(
    @CurrentTenant() tenant: TenantCtx,
    @Param('productId') productId: string,
    @Param('groupId') groupId: string,
  ) {
    return this.optionsService.removeGroup(tenant.id, productId, groupId);
  }

  @Post(':groupId/options')
  @ApiOperation({ summary: 'Ajouter une option à un groupe' })
  createOption(
    @CurrentTenant() tenant: TenantCtx,
    @Param('groupId') groupId: string,
    @Body() dto: CreateOptionDto,
  ) {
    return this.optionsService.createOption(tenant.id, groupId, dto);
  }
}
