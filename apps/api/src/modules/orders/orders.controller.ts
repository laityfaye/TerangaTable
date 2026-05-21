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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OrdersService } from './orders.service';
import { OrdersGateway } from './orders.gateway';
import { CustomFieldsService } from '../custom-fields/custom-fields.service';
import { CreateOrderDto, CreateOrderItemDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { ListOrdersDto } from './dto/list-orders.dto';
import { TransitionOrderDto } from './dto/transition-order.dto';

interface TenantCtx { id: string }
interface UserCtx { id: string }

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly ordersGateway: OrdersGateway,
    private readonly customFieldsService: CustomFieldsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Liste paginée des commandes avec filtres' })
  findAll(@CurrentTenant() tenant: TenantCtx, @Query() query: ListOrdersDto) {
    return this.ordersService.findAll(tenant.id, query);
  }

  @Post()
  @ApiOperation({ summary: 'Créer une commande' })
  async create(
    @CurrentTenant() tenant: TenantCtx,
    @CurrentUser() user: UserCtx,
    @Body() dto: CreateOrderDto,
  ) {
    const order = await this.ordersService.create(tenant.id, user.id, dto);
    this.ordersGateway.emitOrderCreated(tenant.id, order);
    return order;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail complet (items, paiements)' })
  async findOne(
    @CurrentTenant() tenant: TenantCtx,
    @Param('id') id: string,
    @Query('include_custom_fields') includeCustomFields?: string,
  ) {
    const order = await this.ordersService.findOne(tenant.id, id);
    if (includeCustomFields === 'true') {
      const custom_fields = await this.customFieldsService.getValuesFormatted(tenant.id, 'order', id);
      return { ...order, custom_fields };
    }
    return order;
  }

  @Get(':id/transitions')
  @ApiOperation({ summary: 'Transitions disponibles pour cet utilisateur' })
  getTransitions(
    @CurrentTenant() tenant: TenantCtx,
    @CurrentUser() user: UserCtx,
    @Param('id') id: string,
  ) {
    return this.ordersService.getAvailableTransitions(tenant.id, id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier notes ou adresse de livraison' })
  async update(
    @CurrentTenant() tenant: TenantCtx,
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
  ) {
    const order = await this.ordersService.update(tenant.id, id, dto);
    this.ordersGateway.emitOrderUpdated(tenant.id, order);
    return order;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Annuler la commande (soft, status → cancelled)' })
  @HttpCode(HttpStatus.OK)
  async cancel(
    @CurrentTenant() tenant: TenantCtx,
    @CurrentUser() user: UserCtx,
    @Param('id') id: string,
  ) {
    const result = await this.ordersService.cancel(tenant.id, id, user.id);
    this.ordersGateway.emitOrderStateChanged(tenant.id, {
      orderId: id,
      workflowState: result.workflowStateId
        ? { id: result.workflowStateId, name: 'Annulée', color: '#EF4444', slug: 'cancelled' }
        : null,
      updatedAt: new Date().toISOString(),
    });
    return result;
  }

  @Post(':id/transition')
  @ApiOperation({ summary: 'Exécuter une transition workflow' })
  async transition(
    @CurrentTenant() tenant: TenantCtx,
    @CurrentUser() user: UserCtx,
    @Param('id') id: string,
    @Body() dto: TransitionOrderDto,
  ) {
    const result = await this.ordersService.transition(
      tenant.id,
      id,
      dto.transitionId,
      user.id,
    );
    this.ordersGateway.emitOrderStateChanged(tenant.id, {
      orderId: id,
      workflowState: result.workflowState,
      updatedAt: new Date().toISOString(),
    });
    return result;
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Ajouter une ligne à la commande' })
  async addItem(
    @CurrentTenant() tenant: TenantCtx,
    @Param('id') id: string,
    @Body() dto: CreateOrderItemDto,
  ) {
    const item = await this.ordersService.addItem(tenant.id, id, dto);
    const order = await this.ordersService.findOne(tenant.id, id);
    this.ordersGateway.emitOrderUpdated(tenant.id, order);
    return item;
  }

  @Patch(':id/items/:itemId')
  @ApiOperation({ summary: 'Modifier une ligne' })
  async updateItem(
    @CurrentTenant() tenant: TenantCtx,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateOrderItemDto,
  ) {
    const item = await this.ordersService.updateItem(tenant.id, id, itemId, dto);
    const order = await this.ordersService.findOne(tenant.id, id);
    this.ordersGateway.emitOrderUpdated(tenant.id, order);
    return item;
  }

  @Delete(':id/items/:itemId')
  @ApiOperation({ summary: 'Supprimer une ligne' })
  @HttpCode(HttpStatus.OK)
  async removeItem(
    @CurrentTenant() tenant: TenantCtx,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    const result = await this.ordersService.removeItem(tenant.id, id, itemId);
    const order = await this.ordersService.findOne(tenant.id, id);
    this.ordersGateway.emitOrderUpdated(tenant.id, order);
    return result;
  }
}
