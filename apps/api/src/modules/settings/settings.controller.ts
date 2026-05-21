import { Controller, Get, Patch, Post, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { SettingsService, UpdateSettingItem } from './settings.service';

interface TenantCtx { id: string }

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Tous les paramètres du tenant (groupés par catégorie)' })
  findAll(@CurrentTenant() tenant: TenantCtx) {
    return this.settingsService.findAll(tenant.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Mettre à jour des paramètres ({key, value}[])' })
  upsertMany(
    @CurrentTenant() tenant: TenantCtx,
    @Body() items: UpdateSettingItem[],
  ) {
    return this.settingsService.upsertMany(tenant.id, items);
  }

  @Get('modules')
  @ApiOperation({ summary: 'Modules disponibles + statut d\'activation pour ce tenant' })
  getModules(@CurrentTenant() tenant: TenantCtx) {
    return this.settingsService.getModules(tenant.id);
  }

  @Post('modules/:moduleId/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activer un module' })
  activateModule(
    @CurrentTenant() tenant: TenantCtx,
    @Param('moduleId') moduleId: string,
  ) {
    return this.settingsService.activateModule(tenant.id, moduleId);
  }

  @Post('modules/:moduleId/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Désactiver un module' })
  deactivateModule(
    @CurrentTenant() tenant: TenantCtx,
    @Param('moduleId') moduleId: string,
  ) {
    return this.settingsService.deactivateModule(tenant.id, moduleId);
  }
}
