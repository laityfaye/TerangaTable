import {
  Controller,
  Get,
  Post,
  Body,
  Query,
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

  @Get()
  @ApiOperation({ summary: 'Historique des sessions fermées' })
  getHistory(
    @CurrentTenant() tenant: TenantCtx,
    @Query('page')  page?:  string,
    @Query('limit') limit?: string,
  ) {
    return this.posService.getHistory(
      tenant.id,
      page  ? parseInt(page,  10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('current')
  @ApiOperation({ summary: 'Session de caisse en cours (404 si aucune)' })
  getCurrent(@CurrentTenant() tenant: TenantCtx) {
    return this.posService.getCurrent(tenant.id);
  }

  @Get('current/stats')
  @ApiOperation({ summary: 'Stats en temps réel de la session courante' })
  getStats(@CurrentTenant() tenant: TenantCtx) {
    return this.posService.getStats(tenant.id);
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
