import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PosService } from './pos.service';
import { OpenSessionDto } from './dto/open-session.dto';
import { CloseSessionDto } from './dto/close-session.dto';

interface TenantCtx { id: string }
interface UserCtx { id: string }

@ApiTags('POS — Sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('pos/sessions')
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Get('current')
  @ApiOperation({ summary: 'Session de caisse en cours (404 si aucune)' })
  getCurrent(@CurrentTenant() tenant: TenantCtx) {
    return this.posService.getCurrent(tenant.id);
  }

  @Post('open')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Ouvrir une session de caisse' })
  open(
    @CurrentTenant() tenant: TenantCtx,
    @CurrentUser() user: UserCtx,
    @Body() dto: OpenSessionDto,
  ) {
    return this.posService.open(tenant.id, user.id, dto);
  }

  @Post('close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fermer la session de caisse (Ticket Z)' })
  close(
    @CurrentTenant() tenant: TenantCtx,
    @CurrentUser() user: UserCtx,
    @Body() dto: CloseSessionDto,
  ) {
    return this.posService.close(tenant.id, user.id, dto);
  }
}
