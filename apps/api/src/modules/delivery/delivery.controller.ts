import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequireModule } from '../../common/decorators/require-permission.decorator';
import { DeliveryService } from './delivery.service';
import { AssignDeliveryDto } from './dto/assign-delivery.dto';
import { UpdateDeliveryStatusDto } from './dto/update-status.dto';

interface TenantCtx { id: string }

@ApiTags('Delivery')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, ModuleGuard)
@RequireModule('delivery')
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get('kpis')
  @ApiOperation({ summary: 'KPIs livraisons (actives, en attente, livrées, échecs)' })
  getKpis(@CurrentTenant() tenant: TenantCtx) {
    return this.deliveryService.getKpis(tenant.id);
  }

  @Get('active')
  @ApiOperation({ summary: 'Livraisons en cours (non terminées)' })
  findActive(@CurrentTenant() tenant: TenantCtx) {
    return this.deliveryService.findActive(tenant.id);
  }

  @Post('assign')
  @ApiOperation({ summary: 'Assigner manuellement un livreur à une commande' })
  assign(@CurrentTenant() tenant: TenantCtx, @Body() dto: AssignDeliveryDto) {
    return this.deliveryService.assign(tenant.id, dto);
  }

  @Post('auto-assign/:orderId')
  @ApiOperation({ summary: 'Auto-assigner le livreur le moins chargé' })
  autoAssign(@CurrentTenant() tenant: TenantCtx, @Param('orderId') orderId: string) {
    return this.deliveryService.autoAssign(tenant.id, orderId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Mettre à jour le statut d\'une livraison' })
  updateStatus(
    @CurrentTenant() tenant: TenantCtx,
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryStatusDto,
  ) {
    return this.deliveryService.updateStatus(tenant.id, id, dto.status, dto.notes);
  }
}
