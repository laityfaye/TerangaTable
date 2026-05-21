import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { WorkflowsService } from './workflows.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { CreateStateDto } from './dto/create-state.dto';
import { UpdateStateDto } from './dto/update-state.dto';
import { CreateTransitionDto } from './dto/create-transition.dto';
import { UpdateTransitionDto } from './dto/update-transition.dto';

interface TenantCtx { id: string }

@ApiTags('Workflows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  // ── Workflows ─────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Liste les workflows du tenant (avec aperçu des états)' })
  findAll(@CurrentTenant() tenant: TenantCtx) {
    return this.workflowsService.findAll(tenant.id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un workflow' })
  create(@CurrentTenant() tenant: TenantCtx, @Body() dto: CreateWorkflowDto) {
    return this.workflowsService.create(tenant.id, dto);
  }

  // /set-default must come before /:id to avoid route collision
  @Patch(':id/set-default')
  @ApiOperation({ summary: 'Définir comme workflow par défaut pour son entity_type' })
  setDefault(@CurrentTenant() tenant: TenantCtx, @Param('id') id: string) {
    return this.workflowsService.setDefault(tenant.id, id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Dupliquer un workflow (états + transitions)' })
  duplicate(@CurrentTenant() tenant: TenantCtx, @Param('id') id: string) {
    return this.workflowsService.duplicate(tenant.id, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail du workflow avec états et transitions' })
  findOne(@CurrentTenant() tenant: TenantCtx, @Param('id') id: string) {
    return this.workflowsService.findOne(tenant.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier le nom ou entity_type du workflow' })
  update(
    @CurrentTenant() tenant: TenantCtx,
    @Param('id') id: string,
    @Body() dto: UpdateWorkflowDto,
  ) {
    return this.workflowsService.update(tenant.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un workflow (refusé si workflow par défaut)' })
  remove(@CurrentTenant() tenant: TenantCtx, @Param('id') id: string) {
    return this.workflowsService.remove(tenant.id, id);
  }

  // ── States ────────────────────────────────────────────────────────────────

  @Get(':id/states')
  @ApiOperation({ summary: 'Liste les états du workflow' })
  findStates(@CurrentTenant() tenant: TenantCtx, @Param('id') id: string) {
    return this.workflowsService.findStates(tenant.id, id);
  }

  @Post(':id/states')
  @ApiOperation({ summary: 'Ajouter un état' })
  createState(
    @CurrentTenant() tenant: TenantCtx,
    @Param('id') id: string,
    @Body() dto: CreateStateDto,
  ) {
    return this.workflowsService.createState(tenant.id, id, dto);
  }

  @Patch(':id/states/:stateId')
  @ApiOperation({ summary: 'Modifier un état (nom, couleur, flags, sort_order)' })
  updateState(
    @CurrentTenant() tenant: TenantCtx,
    @Param('id') id: string,
    @Param('stateId') stateId: string,
    @Body() dto: UpdateStateDto,
  ) {
    return this.workflowsService.updateState(tenant.id, id, stateId, dto);
  }

  @Delete(':id/states/:stateId')
  @ApiOperation({ summary: 'Supprimer un état (refusé si des commandes y sont)' })
  removeState(
    @CurrentTenant() tenant: TenantCtx,
    @Param('id') id: string,
    @Param('stateId') stateId: string,
  ) {
    return this.workflowsService.removeState(tenant.id, id, stateId);
  }

  // ── Transitions ───────────────────────────────────────────────────────────

  @Get(':id/transitions')
  @ApiOperation({ summary: 'Liste les transitions du workflow' })
  findTransitions(@CurrentTenant() tenant: TenantCtx, @Param('id') id: string) {
    return this.workflowsService.findTransitions(tenant.id, id);
  }

  @Post(':id/transitions')
  @ApiOperation({ summary: 'Ajouter une transition' })
  createTransition(
    @CurrentTenant() tenant: TenantCtx,
    @Param('id') id: string,
    @Body() dto: CreateTransitionDto,
  ) {
    return this.workflowsService.createTransition(tenant.id, id, dto);
  }

  @Patch(':id/transitions/:tid')
  @ApiOperation({ summary: 'Modifier une transition' })
  updateTransition(
    @CurrentTenant() tenant: TenantCtx,
    @Param('id') id: string,
    @Param('tid') tid: string,
    @Body() dto: UpdateTransitionDto,
  ) {
    return this.workflowsService.updateTransition(tenant.id, id, tid, dto);
  }

  @Delete(':id/transitions/:tid')
  @ApiOperation({ summary: 'Supprimer une transition' })
  removeTransition(
    @CurrentTenant() tenant: TenantCtx,
    @Param('id') id: string,
    @Param('tid') tid: string,
  ) {
    return this.workflowsService.removeTransition(tenant.id, id, tid);
  }
}
