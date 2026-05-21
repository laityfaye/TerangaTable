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
import { CustomersService } from './customers.service';
import { CustomFieldsService } from '../custom-fields/custom-fields.service';
import { ListCustomersDto } from './dto/list-customers.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

interface TenantCtx { id: string }

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('customers')
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly customFieldsService: CustomFieldsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Liste clients avec segmentation et pagination' })
  findAll(@CurrentTenant() tenant: TenantCtx, @Query() query: ListCustomersDto) {
    return this.customersService.findAll(tenant.id, query);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un client manuellement' })
  create(@CurrentTenant() tenant: TenantCtx, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(tenant.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fiche complète du client' })
  async findOne(
    @CurrentTenant() tenant: TenantCtx,
    @Param('id') id: string,
    @Query('include_custom_fields') includeCustomFields?: string,
  ) {
    const customer = await this.customersService.findOne(tenant.id, id);
    if (includeCustomFields === 'true') {
      const custom_fields = await this.customFieldsService.getValuesFormatted(tenant.id, 'customer', id);
      return { ...customer, custom_fields };
    }
    return customer;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier le client' })
  update(
    @CurrentTenant() tenant: TenantCtx,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(tenant.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Archiver le client' })
  @HttpCode(HttpStatus.OK)
  archive(@CurrentTenant() tenant: TenantCtx, @Param('id') id: string) {
    return this.customersService.archive(tenant.id, id);
  }

  @Get(':id/orders')
  @ApiOperation({ summary: 'Historique des commandes du client' })
  getOrders(@CurrentTenant() tenant: TenantCtx, @Param('id') id: string) {
    return this.customersService.getOrders(tenant.id, id);
  }

  @Get(':id/loyalty')
  @ApiOperation({ summary: 'Historique des points fidélité du client' })
  getLoyalty(@CurrentTenant() tenant: TenantCtx, @Param('id') id: string) {
    return this.customersService.getLoyaltyHistory(tenant.id, id);
  }
}
