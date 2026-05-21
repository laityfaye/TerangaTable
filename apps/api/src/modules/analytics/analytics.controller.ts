import {
  Controller,
  Get,
  Query,
  UseGuards,
  Res,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto, RevenueQueryDto, ExportQueryDto } from './dto/analytics-query.dto';

interface TenantCtx { id: string }

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'KPIs globaux avec variation N-1' })
  getSummary(
    @CurrentTenant() tenant: TenantCtx,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getSummary(tenant.id, query);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'CA par jour/semaine/mois avec comparaison N-1' })
  getRevenue(
    @CurrentTenant() tenant: TenantCtx,
    @Query() query: RevenueQueryDto,
  ) {
    return this.analyticsService.getRevenue(tenant.id, query);
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Top 10 produits (quantité + CA)' })
  getTopProducts(
    @CurrentTenant() tenant: TenantCtx,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getTopProducts(tenant.id, query);
  }

  @Get('peak-hours')
  @ApiOperation({ summary: 'Heatmap 7j × 24h (count commandes)' })
  getPeakHours(
    @CurrentTenant() tenant: TenantCtx,
    @Query('days') days?: string,
  ) {
    return this.analyticsService.getPeakHours(tenant.id, days ? parseInt(days, 10) : 7);
  }

  @Get('order-types')
  @ApiOperation({ summary: 'Répartition dine_in/takeaway/delivery/online' })
  getOrderTypes(
    @CurrentTenant() tenant: TenantCtx,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getOrderTypes(tenant.id, query);
  }

  @Get('staff')
  @ApiOperation({ summary: 'Performance par agent (nb commandes, CA)' })
  getStaff(
    @CurrentTenant() tenant: TenantCtx,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getStaff(tenant.id, query);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export CSV' })
  @Header('Cache-Control', 'no-store')
  async export(
    @CurrentTenant() tenant: TenantCtx,
    @Query() query: ExportQueryDto,
    @Res() res: Response,
  ) {
    const csv = await this.analyticsService.getExportData(tenant.id, query);
    const filename = `analytics-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Cache', 'MISS');
    res.send('﻿' + csv); // BOM for Excel UTF-8
  }
}
