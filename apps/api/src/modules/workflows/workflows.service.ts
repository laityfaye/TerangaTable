import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { CreateStateDto } from './dto/create-state.dto';
import { UpdateStateDto } from './dto/update-state.dto';
import { CreateTransitionDto } from './dto/create-transition.dto';
import { UpdateTransitionDto } from './dto/update-transition.dto';

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 100);
}

@Injectable()
export class WorkflowsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Workflows ─────────────────────────────────────────────────────────────

  async findAll(tenantId: string) {
    const workflows = await this.prisma.workflowDefinition.findMany({
      where: { tenantId },
      include: {
        _count: { select: { states: true, transitions: true } },
        states: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, name: true, color: true, isInitial: true, isTerminal: true, sortOrder: true },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    return workflows.map((w) => ({
      id: w.id,
      name: w.name,
      entity_type: w.entityType,
      is_default: w.isDefault,
      states_count: w._count.states,
      transitions_count: w._count.transitions,
      states: w.states.map((s) => ({
        id: s.id,
        name: s.name,
        color: s.color,
        is_initial: s.isInitial,
        is_terminal: s.isTerminal,
        sort_order: s.sortOrder,
      })),
    }));
  }

  async findOne(tenantId: string, id: string) {
    const workflow = await this.prisma.workflowDefinition.findFirst({
      where: { id, tenantId },
      include: {
        states: {
          orderBy: { sortOrder: 'asc' },
        },
        transitions: {
          include: {
            fromState: { select: { id: true, name: true, color: true } },
            toState: { select: { id: true, name: true, color: true } },
          },
        },
      },
    });

    if (!workflow) throw new NotFoundException('Workflow introuvable');

    return {
      id: workflow.id,
      name: workflow.name,
      entity_type: workflow.entityType,
      is_default: workflow.isDefault,
      states: workflow.states.map((s) => ({
        id: s.id,
        workflow_id: s.workflowId,
        name: s.name,
        slug: s.slug,
        color: s.color,
        is_initial: s.isInitial,
        is_terminal: s.isTerminal,
        triggers_alert: s.triggersAlert,
        sort_order: s.sortOrder,
      })),
      transitions: workflow.transitions.map((t) => ({
        id: t.id,
        workflow_id: t.workflowId,
        from_state_id: t.fromStateId,
        to_state_id: t.toStateId,
        name: t.name,
        allowed_roles: t.allowedRoles,
        from_state: t.fromState,
        to_state: t.toState,
      })),
    };
  }

  async create(tenantId: string, dto: CreateWorkflowDto) {
    if (dto.is_default) {
      await this.prisma.workflowDefinition.updateMany({
        where: { tenantId, entityType: dto.entity_type, isDefault: true },
        data: { isDefault: false },
      });
    }

    const workflow = await this.prisma.workflowDefinition.create({
      data: {
        tenantId,
        name: dto.name,
        entityType: dto.entity_type,
        isDefault: dto.is_default ?? false,
      },
    });

    return {
      id: workflow.id,
      name: workflow.name,
      entity_type: workflow.entityType,
      is_default: workflow.isDefault,
    };
  }

  async update(tenantId: string, id: string, dto: UpdateWorkflowDto) {
    await this.ensureWorkflowExists(tenantId, id);

    const updated = await this.prisma.workflowDefinition.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.entity_type !== undefined && { entityType: dto.entity_type }),
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      entity_type: updated.entityType,
      is_default: updated.isDefault,
    };
  }

  async remove(tenantId: string, id: string) {
    const workflow = await this.ensureWorkflowExists(tenantId, id);

    if (workflow.isDefault) {
      throw new BadRequestException('Impossible de supprimer le workflow par défaut');
    }

    await this.prisma.workflowDefinition.delete({ where: { id } });
    return { deleted: true };
  }

  async setDefault(tenantId: string, id: string) {
    const workflow = await this.ensureWorkflowExists(tenantId, id);

    await this.prisma.$transaction([
      this.prisma.workflowDefinition.updateMany({
        where: { tenantId, entityType: workflow.entityType, isDefault: true },
        data: { isDefault: false },
      }),
      this.prisma.workflowDefinition.update({
        where: { id },
        data: { isDefault: true },
      }),
    ]);

    return { id, is_default: true };
  }

  async duplicate(tenantId: string, id: string) {
    const source = await this.findOne(tenantId, id);

    const newWorkflow = await this.prisma.workflowDefinition.create({
      data: {
        tenantId,
        name: `${source.name} (copie)`,
        entityType: source.entity_type,
        isDefault: false,
      },
    });

    // Map old state ids → new state ids for transitions
    const stateIdMap = new Map<string, string>();

    for (const state of source.states) {
      const newState = await this.prisma.workflowState.create({
        data: {
          tenantId,
          workflowId: newWorkflow.id,
          name: state.name,
          slug: state.slug,
          color: state.color,
          isInitial: state.is_initial,
          isTerminal: state.is_terminal,
          triggersAlert: state.triggers_alert,
          sortOrder: state.sort_order,
        },
      });
      stateIdMap.set(state.id, newState.id);
    }

    for (const transition of source.transitions) {
      const newFromStateId = transition.from_state_id
        ? stateIdMap.get(transition.from_state_id) ?? null
        : null;
      const newToStateId = stateIdMap.get(transition.to_state_id);
      if (!newToStateId) continue;

      await this.prisma.workflowTransition.create({
        data: {
          workflowId: newWorkflow.id,
          fromStateId: newFromStateId,
          toStateId: newToStateId,
          name: transition.name,
          allowedRoles: transition.allowed_roles,
        },
      });
    }

    return this.findOne(tenantId, newWorkflow.id);
  }

  // ── States ────────────────────────────────────────────────────────────────

  async findStates(tenantId: string, workflowId: string) {
    await this.ensureWorkflowExists(tenantId, workflowId);

    const states = await this.prisma.workflowState.findMany({
      where: { workflowId, tenantId },
      orderBy: { sortOrder: 'asc' },
    });

    return states.map((s) => this.mapState(s));
  }

  async createState(tenantId: string, workflowId: string, dto: CreateStateDto) {
    await this.ensureWorkflowExists(tenantId, workflowId);

    const slug = dto.slug ?? toSlug(dto.name);

    const existing = await this.prisma.workflowState.findFirst({
      where: { workflowId, slug },
    });
    if (existing) throw new ConflictException(`Un état avec le slug "${slug}" existe déjà dans ce workflow`);

    // Only one initial state allowed
    if (dto.is_initial) {
      await this.prisma.workflowState.updateMany({
        where: { workflowId, isInitial: true },
        data: { isInitial: false },
      });
    }

    const state = await this.prisma.workflowState.create({
      data: {
        tenantId,
        workflowId,
        name: dto.name,
        slug,
        color: dto.color,
        isInitial: dto.is_initial ?? false,
        isTerminal: dto.is_terminal ?? false,
        triggersAlert: dto.triggers_alert ?? false,
        sortOrder: dto.sort_order ?? 0,
      },
    });

    return this.mapState(state);
  }

  async updateState(tenantId: string, workflowId: string, stateId: string, dto: UpdateStateDto) {
    await this.ensureWorkflowExists(tenantId, workflowId);
    await this.ensureStateExists(tenantId, workflowId, stateId);

    if (dto.slug) {
      const conflict = await this.prisma.workflowState.findFirst({
        where: { workflowId, slug: dto.slug, id: { not: stateId } },
      });
      if (conflict) throw new ConflictException(`Un état avec le slug "${dto.slug}" existe déjà`);
    }

    if (dto.is_initial) {
      await this.prisma.workflowState.updateMany({
        where: { workflowId, isInitial: true, id: { not: stateId } },
        data: { isInitial: false },
      });
    }

    const state = await this.prisma.workflowState.update({
      where: { id: stateId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.is_initial !== undefined && { isInitial: dto.is_initial }),
        ...(dto.is_terminal !== undefined && { isTerminal: dto.is_terminal }),
        ...(dto.triggers_alert !== undefined && { triggersAlert: dto.triggers_alert }),
        ...(dto.sort_order !== undefined && { sortOrder: dto.sort_order }),
      },
    });

    return this.mapState(state);
  }

  async removeState(tenantId: string, workflowId: string, stateId: string) {
    await this.ensureWorkflowExists(tenantId, workflowId);
    await this.ensureStateExists(tenantId, workflowId, stateId);

    const usedByOrders = await this.prisma.order.count({
      where: { tenantId, workflowStateId: stateId },
    });
    if (usedByOrders > 0) {
      throw new BadRequestException(
        `Impossible de supprimer : ${usedByOrders} commande(s) sont dans cet état`,
      );
    }

    await this.prisma.workflowState.delete({ where: { id: stateId } });
    return { deleted: true };
  }

  // ── Transitions ───────────────────────────────────────────────────────────

  async findTransitions(tenantId: string, workflowId: string) {
    await this.ensureWorkflowExists(tenantId, workflowId);

    const transitions = await this.prisma.workflowTransition.findMany({
      where: { workflowId },
      include: {
        fromState: { select: { id: true, name: true, color: true } },
        toState: { select: { id: true, name: true, color: true } },
      },
    });

    return transitions.map((t) => this.mapTransition(t));
  }

  async createTransition(tenantId: string, workflowId: string, dto: CreateTransitionDto) {
    await this.ensureWorkflowExists(tenantId, workflowId);

    await this.ensureStatesInWorkflow(workflowId, dto.from_state_id ?? null, dto.to_state_id);

    const transition = await this.prisma.workflowTransition.create({
      data: {
        workflowId,
        fromStateId: dto.from_state_id ?? null,
        toStateId: dto.to_state_id,
        name: dto.name,
        allowedRoles: dto.allowed_roles ?? [],
      },
      include: {
        fromState: { select: { id: true, name: true, color: true } },
        toState: { select: { id: true, name: true, color: true } },
      },
    });

    return this.mapTransition(transition);
  }

  async updateTransition(
    tenantId: string,
    workflowId: string,
    transitionId: string,
    dto: UpdateTransitionDto,
  ) {
    await this.ensureWorkflowExists(tenantId, workflowId);
    await this.ensureTransitionExists(workflowId, transitionId);

    if (dto.from_state_id !== undefined || dto.to_state_id !== undefined) {
      const current = await this.prisma.workflowTransition.findUnique({ where: { id: transitionId } });
      const fromId = dto.from_state_id !== undefined ? (dto.from_state_id ?? null) : current!.fromStateId;
      const toId = dto.to_state_id ?? current!.toStateId;
      await this.ensureStatesInWorkflow(workflowId, fromId, toId);
    }

    const transition = await this.prisma.workflowTransition.update({
      where: { id: transitionId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.from_state_id !== undefined && { fromStateId: dto.from_state_id ?? null }),
        ...(dto.to_state_id !== undefined && { toStateId: dto.to_state_id }),
        ...(dto.allowed_roles !== undefined && { allowedRoles: dto.allowed_roles }),
      },
      include: {
        fromState: { select: { id: true, name: true, color: true } },
        toState: { select: { id: true, name: true, color: true } },
      },
    });

    return this.mapTransition(transition);
  }

  async removeTransition(tenantId: string, workflowId: string, transitionId: string) {
    await this.ensureWorkflowExists(tenantId, workflowId);
    await this.ensureTransitionExists(workflowId, transitionId);
    await this.prisma.workflowTransition.delete({ where: { id: transitionId } });
    return { deleted: true };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async ensureWorkflowExists(tenantId: string, id: string) {
    const wf = await this.prisma.workflowDefinition.findFirst({ where: { id, tenantId } });
    if (!wf) throw new NotFoundException('Workflow introuvable');
    return wf;
  }

  private async ensureStateExists(tenantId: string, workflowId: string, stateId: string) {
    const state = await this.prisma.workflowState.findFirst({
      where: { id: stateId, workflowId, tenantId },
    });
    if (!state) throw new NotFoundException('État introuvable');
    return state;
  }

  private async ensureTransitionExists(workflowId: string, transitionId: string) {
    const t = await this.prisma.workflowTransition.findFirst({
      where: { id: transitionId, workflowId },
    });
    if (!t) throw new NotFoundException('Transition introuvable');
    return t;
  }

  private async ensureStatesInWorkflow(workflowId: string, fromStateId: string | null, toStateId: string) {
    const toState = await this.prisma.workflowState.findFirst({ where: { id: toStateId, workflowId } });
    if (!toState) throw new BadRequestException('État destination invalide pour ce workflow');

    if (fromStateId) {
      const fromState = await this.prisma.workflowState.findFirst({ where: { id: fromStateId, workflowId } });
      if (!fromState) throw new BadRequestException('État source invalide pour ce workflow');
    }
  }

  private mapState(s: {
    id: string; workflowId: string; tenantId: string; name: string; slug: string;
    color: string; isInitial: boolean; isTerminal: boolean; triggersAlert: boolean; sortOrder: number;
  }) {
    return {
      id: s.id,
      workflow_id: s.workflowId,
      name: s.name,
      slug: s.slug,
      color: s.color,
      is_initial: s.isInitial,
      is_terminal: s.isTerminal,
      triggers_alert: s.triggersAlert,
      sort_order: s.sortOrder,
    };
  }

  private mapTransition(t: {
    id: string; workflowId: string; fromStateId: string | null; toStateId: string;
    name: string; allowedRoles: string[];
    fromState?: { id: string; name: string; color: string } | null;
    toState?: { id: string; name: string; color: string };
  }) {
    return {
      id: t.id,
      workflow_id: t.workflowId,
      from_state_id: t.fromStateId,
      to_state_id: t.toStateId,
      name: t.name,
      allowed_roles: t.allowedRoles,
      from_state: t.fromState ?? null,
      to_state: t.toState,
    };
  }
}
