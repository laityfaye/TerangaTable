import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { WebsiteService } from './website.service';
import { StorageService } from '../storage/storage.service';
import { UpdateWebsiteSettingsDto } from './dto/update-website-settings.dto';

interface TenantCtx { id: string; slug: string }

@ApiTags('Website Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('website')
export class WebsiteDashboardController {
  constructor(
    private readonly websiteService: WebsiteService,
    private readonly storageService: StorageService,
  ) {}

  @Get('settings')
  @ApiOperation({ summary: 'Récupère les paramètres du site vitrine' })
  getSettings(@CurrentTenant() tenant: TenantCtx) {
    return this.websiteService.getDashboardSettings(tenant.id, tenant.slug);
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Met à jour les paramètres du site vitrine' })
  updateSettings(
    @CurrentTenant() tenant: TenantCtx,
    @Body() dto: UpdateWebsiteSettingsDto,
  ) {
    return this.websiteService.updateDashboardSettings(tenant.id, tenant.slug, dto);
  }

  @Get('themes')
  @ApiOperation({ summary: 'Liste les thèmes disponibles' })
  getThemes() {
    return this.websiteService.getThemes();
  }

  @Post('publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publie le site vitrine' })
  publish(@CurrentTenant() tenant: TenantCtx) {
    return this.websiteService.publishWebsite(tenant.id, tenant.slug);
  }

  @Post('unpublish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dépublie le site vitrine' })
  unpublish(@CurrentTenant() tenant: TenantCtx) {
    return this.websiteService.unpublishWebsite(tenant.id, tenant.slug);
  }

  @Post('check-domain')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vérifie le statut d\'un domaine personnalisé' })
  checkDomain(
    @CurrentTenant() tenant: TenantCtx,
    @Body('domain') domain: string,
  ) {
    return this.websiteService.checkDomain(tenant.id, domain);
  }

  @Post('upload-logo')
  @UseInterceptors(FileInterceptor('logo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload du logo vitrine (SVG, PNG, WebP — max 2 Mo)' })
  async uploadLogo(
    @CurrentTenant() tenant: TenantCtx,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    const url = await this.storageService.uploadWebsiteAsset(tenant.id, file, 'logo');
    return { logo_url: url };
  }

  @Post('upload-hero')
  @UseInterceptors(FileInterceptor('hero'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload de l\'image hero (JPEG, PNG, WebP — max 5 Mo)' })
  async uploadHero(
    @CurrentTenant() tenant: TenantCtx,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    const url = await this.storageService.uploadWebsiteAsset(tenant.id, file, 'hero');
    return { hero_image_url: url };
  }

  @Post('upload-favicon')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload du favicon (ICO, PNG, SVG — max 0.5 Mo)' })
  async uploadFavicon(
    @CurrentTenant() tenant: TenantCtx,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    const url = await this.storageService.uploadWebsiteAsset(tenant.id, file, 'favicon');
    return { image_url: url };
  }

  @Post('upload-about')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload de l\'image "À propos" (JPEG, PNG, WebP — max 3 Mo)' })
  async uploadAbout(
    @CurrentTenant() tenant: TenantCtx,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    const url = await this.storageService.uploadWebsiteAsset(tenant.id, file, 'about');
    return { image_url: url };
  }

  @Post('upload-gallery')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload d\'une image de galerie (JPEG, PNG, WebP — max 3 Mo)' })
  async uploadGallery(
    @CurrentTenant() tenant: TenantCtx,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    const url = await this.storageService.uploadWebsiteAsset(tenant.id, file, 'gallery');
    return { image_url: url };
  }
}
