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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { ProductsService } from './products.service';
import { CustomFieldsService } from '../../custom-fields/custom-fields.service';
import { StorageService } from '../../storage/storage.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ListProductsDto } from './dto/list-products.dto';
import { ToggleAvailabilityDto } from './dto/toggle-availability.dto';

interface TenantCtx { id: string }

@ApiTags('Menu — Produits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly customFieldsService: CustomFieldsService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Liste paginée des produits avec filtres' })
  findAll(@CurrentTenant() tenant: TenantCtx, @Query() dto: ListProductsDto) {
    return this.productsService.findAll(tenant.id, dto);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un produit' })
  create(@CurrentTenant() tenant: TenantCtx, @Body() dto: CreateProductDto) {
    return this.productsService.create(tenant.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail complet d'un produit (avec groupes d'options)" })
  async findOne(
    @CurrentTenant() tenant: TenantCtx,
    @Param('id') id: string,
    @Query('include_custom_fields') includeCustomFields?: string,
  ) {
    const product = await this.productsService.findOne(tenant.id, id);
    if (includeCustomFields === 'true') {
      const custom_fields = await this.customFieldsService.getValuesFormatted(tenant.id, 'product', id);
      return { ...product, custom_fields };
    }
    return product;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un produit' })
  update(
    @CurrentTenant() tenant: TenantCtx,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(tenant.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete un produit (is_available=false)' })
  remove(@CurrentTenant() tenant: TenantCtx, @Param('id') id: string) {
    return this.productsService.remove(tenant.id, id);
  }

  @Post(':id/upload-image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload image produit → MinIO / filesystem local' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  async uploadImage(
    @CurrentTenant() tenant: TenantCtx,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    const { url } = await this.storageService.uploadImage(tenant.id, file);
    await this.productsService.update(tenant.id, id, { image_url: url });
    return { image_url: url };
  }

  @Patch(':id/availability')
  @ApiOperation({ summary: 'Toggle rapide disponibilité produit' })
  toggleAvailability(
    @CurrentTenant() tenant: TenantCtx,
    @Param('id') id: string,
    @Body() dto: ToggleAvailabilityDto,
  ) {
    return this.productsService.toggleAvailability(tenant.id, id, dto.is_available);
  }
}
