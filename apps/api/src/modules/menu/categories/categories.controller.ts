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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ReorderCategoryDto } from './dto/reorder-category.dto';

interface TenantCtx { id: string }

@ApiTags('Menu — Catégories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Liste hiérarchique des catégories (parent → enfants)' })
  findAll(@CurrentTenant() tenant: TenantCtx) {
    return this.categoriesService.findAll(tenant.id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer une catégorie' })
  create(@CurrentTenant() tenant: TenantCtx, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(tenant.id, dto);
  }

  // /reorder must be declared before /:id to avoid route collision
  @Patch('reorder')
  @ApiOperation({ summary: 'Réordonner les catégories en masse' })
  reorder(@CurrentTenant() tenant: TenantCtx, @Body() dto: ReorderCategoryDto) {
    return this.categoriesService.reorder(tenant.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une catégorie + nombre de produits' })
  findOne(@CurrentTenant() tenant: TenantCtx, @Param('id') id: string) {
    return this.categoriesService.findOne(tenant.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une catégorie' })
  update(
    @CurrentTenant() tenant: TenantCtx,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(tenant.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une catégorie (refusé si produits actifs)' })
  remove(@CurrentTenant() tenant: TenantCtx, @Param('id') id: string) {
    return this.categoriesService.remove(tenant.id, id);
  }
}
