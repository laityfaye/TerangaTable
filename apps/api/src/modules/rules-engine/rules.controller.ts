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
import { RulesService } from './rules.service';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { ListRulesDto } from './dto/list-rules.dto';
import { TestRuleDto } from './dto/test-rule.dto';

interface TenantCtx {
  id: string;
}

@ApiTags('Rules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('rules')
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Get()
  @ApiOperation({ summary: 'Liste paginée des règles métier du tenant' })
  findAll(@CurrentTenant() tenant: TenantCtx, @Query() query: ListRulesDto) {
    return this.rulesService.findAll(tenant.id, query);
  }

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle règle' })
  create(@CurrentTenant() tenant: TenantCtx, @Body() dto: CreateRuleDto) {
    return this.rulesService.create(tenant.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une règle' })
  findOne(@CurrentTenant() tenant: TenantCtx, @Param('id') id: string) {
    return this.rulesService.findOne(tenant.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une règle (conditions, actions, nom…)' })
  update(
    @CurrentTenant() tenant: TenantCtx,
    @Param('id') id: string,
    @Body() dto: UpdateRuleDto,
  ) {
    return this.rulesService.update(tenant.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une règle' })
  remove(@CurrentTenant() tenant: TenantCtx, @Param('id') id: string) {
    return this.rulesService.remove(tenant.id, id);
  }

  @Post(':id/toggle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activer ou désactiver une règle' })
  toggle(@CurrentTenant() tenant: TenantCtx, @Param('id') id: string) {
    return this.rulesService.toggle(tenant.id, id);
  }

  @Post(':id/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tester une règle avec un payload fictif (dry-run)' })
  test(
    @CurrentTenant() tenant: TenantCtx,
    @Param('id') id: string,
    @Body() dto: TestRuleDto,
  ) {
    return this.rulesService.test(tenant.id, id, dto.payload);
  }
}
