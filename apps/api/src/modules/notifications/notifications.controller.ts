import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

interface TenantCtx { id: string }
interface UserCtx { id: string }

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des notifications (non lues en premier)' })
  findAll(@CurrentTenant() tenant: TenantCtx, @CurrentUser() user: UserCtx) {
    return this.notificationsService.findAll(tenant.id, user.id);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tout marquer comme lu' })
  markAllRead(@CurrentTenant() tenant: TenantCtx, @CurrentUser() user: UserCtx) {
    return this.notificationsService.markAllRead(tenant.id, user.id);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  markRead(
    @CurrentTenant() tenant: TenantCtx,
    @CurrentUser() user: UserCtx,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markRead(tenant.id, user.id, id);
  }
}
