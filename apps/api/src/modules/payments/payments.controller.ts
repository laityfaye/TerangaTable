import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ListPaymentsDto } from './dto/list-payments.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';

interface TenantCtx { id: string }

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Enregistrer un paiement (partiel ou total)' })
  create(@CurrentTenant() tenant: TenantCtx, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.createPayment(tenant.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Historique paiements avec filtres (date, méthode, statut)' })
  findAll(@CurrentTenant() tenant: TenantCtx, @Query() query: ListPaymentsDto) {
    return this.paymentsService.findAll(tenant.id, query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Rapport encaissements par méthode et période' })
  getSummary(
    @CurrentTenant() tenant: TenantCtx,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
  ) {
    return this.paymentsService.getSummary(tenant.id, { date_from: dateFrom, date_to: dateTo });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un paiement' })
  findOne(@CurrentTenant() tenant: TenantCtx, @Param('id') id: string) {
    return this.paymentsService.findOne(tenant.id, id);
  }

  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rembourser un paiement (crée un paiement négatif)' })
  refund(
    @CurrentTenant() tenant: TenantCtx,
    @Param('id') id: string,
    @Body() dto: RefundPaymentDto,
  ) {
    return this.paymentsService.refund(tenant.id, id, dto);
  }
}
