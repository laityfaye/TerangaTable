import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { ReservationsService } from './reservations.service';
import { ReservationsGateway } from './reservations.gateway';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ListReservationsDto } from './dto/list-reservations.dto';

interface TenantCtx { id: string }

@ApiTags('Reservations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
    private readonly reservationsGateway: ReservationsGateway,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Liste paginée des réservations avec filtres' })
  findAll(@CurrentTenant() tenant: TenantCtx, @Query() query: ListReservationsDto) {
    return this.reservationsService.findAll(tenant.id, query);
  }

  @Post()
  @ApiOperation({ summary: 'Créer une réservation' })
  async create(@CurrentTenant() tenant: TenantCtx, @Body() dto: CreateReservationDto) {
    const reservation = await this.reservationsService.create(tenant.id, dto);
    this.reservationsGateway.emitReservationCreated(tenant.id, reservation);
    return reservation;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail complet d\'une réservation' })
  findOne(@CurrentTenant() tenant: TenantCtx, @Param('id') id: string) {
    return this.reservationsService.findOne(tenant.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier table, datetime ou statut' })
  async update(
    @CurrentTenant() tenant: TenantCtx,
    @Param('id') id: string,
    @Body() dto: UpdateReservationDto,
  ) {
    const reservation = await this.reservationsService.update(tenant.id, id, dto);
    this.reservationsGateway.emitReservationUpdated(tenant.id, reservation);
    return reservation;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Annuler une réservation (status → cancelled)' })
  @HttpCode(HttpStatus.OK)
  async cancel(@CurrentTenant() tenant: TenantCtx, @Param('id') id: string) {
    const reservation = await this.reservationsService.cancel(tenant.id, id);
    this.reservationsGateway.emitReservationUpdated(tenant.id, reservation);
    return reservation;
  }
}
