import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { SetPermissionsDto } from './dto/set-permissions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import type { TenantContext } from '../../common/interceptors/tenant-context.interceptor';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard, PermissionGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Roles('manager', 'restaurant_owner', 'super_admin')
  @RequirePermission('settings.view')
  @ApiOperation({ summary: 'Lister tous les rôles (système + custom du tenant)' })
  findAll(@CurrentTenant() tenant: TenantContext) {
    return this.rolesService.findAll(tenant.id);
  }

  @Get('permissions')
  @Roles('manager', 'restaurant_owner', 'super_admin')
  @RequirePermission('settings.view')
  @ApiOperation({ summary: 'Lister toutes les permissions disponibles' })
  findAllPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('manager', 'restaurant_owner', 'super_admin')
  @RequirePermission('settings.edit')
  @ApiOperation({ summary: 'Créer un rôle custom pour le tenant' })
  @ApiResponse({ status: 201, description: 'Rôle créé' })
  @ApiResponse({ status: 409, description: 'Slug déjà utilisé' })
  create(@CurrentTenant() tenant: TenantContext, @Body() dto: CreateRoleDto) {
    return this.rolesService.create(tenant.id, dto);
  }

  @Put(':id/permissions')
  @Roles('manager', 'restaurant_owner', 'super_admin')
  @RequirePermission('settings.edit')
  @ApiOperation({ summary: 'Assigner des permissions à un rôle' })
  setPermissions(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: SetPermissionsDto,
  ) {
    return this.rolesService.setPermissions(tenant.id, id, dto.permissionIds);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('manager', 'restaurant_owner', 'super_admin')
  @RequirePermission('settings.edit')
  @ApiOperation({ summary: 'Supprimer un rôle custom' })
  delete(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.rolesService.delete(tenant.id, id);
  }
}
