import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { LoyaltyService } from './loyalty.service';
import { EarnPointsDto, RedeemPointsDto, LoyaltySettingsDto } from './dto/loyalty.dto';

interface TenantCtx { id: string }

@ApiTags('Loyalty')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('settings')
  @ApiOperation({ summary: 'Paramètres du programme fidélité' })
  getSettings(@CurrentTenant() tenant: TenantCtx) {
    return this.loyaltyService.getSettings(tenant.id);
  }

  @Put('settings')
  @ApiOperation({ summary: 'Mettre à jour les paramètres fidélité' })
  updateSettings(@CurrentTenant() tenant: TenantCtx, @Body() dto: LoyaltySettingsDto) {
    return this.loyaltyService.updateSettings(tenant.id, dto);
  }

  @Post('earn')
  @ApiOperation({ summary: 'Créditer des points après paiement' })
  earn(@CurrentTenant() tenant: TenantCtx, @Body() dto: EarnPointsDto) {
    return this.loyaltyService.earn(tenant.id, dto);
  }

  @Post('redeem')
  @ApiOperation({ summary: 'Dépenser des points (crée une réduction)' })
  redeem(@CurrentTenant() tenant: TenantCtx, @Body() dto: RedeemPointsDto) {
    return this.loyaltyService.redeem(tenant.id, dto);
  }

  @Get('balance/:customerId')
  @ApiOperation({ summary: 'Solde et historique points du client' })
  getBalance(@CurrentTenant() tenant: TenantCtx, @Param('customerId') customerId: string) {
    return this.loyaltyService.getBalance(tenant.id, customerId);
  }
}
