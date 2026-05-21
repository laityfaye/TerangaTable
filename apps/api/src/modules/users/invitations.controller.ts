import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import type { TenantContext } from '../../common/interceptors/tenant-context.interceptor';

interface JwtUser { id: string }

@ApiTags('invitations')
@ApiBearerAuth()
@Controller('users/invitations')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard, PermissionGuard)
@Roles('manager', 'restaurant_owner', 'super_admin')
@RequirePermission('settings.edit')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get()
  @RequirePermission('settings.view')
  @ApiOperation({ summary: 'Lister les invitations en attente' })
  findPending(@CurrentTenant() tenant: TenantContext) {
    return this.invitationsService.findPending(tenant.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une invitation' })
  @ApiResponse({ status: 201, description: 'Invitation créée (lien logué en dev)' })
  create(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.invitationsService.create(tenant.id, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Révoquer une invitation' })
  revoke(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.invitationsService.revoke(tenant.id, id);
  }
}
