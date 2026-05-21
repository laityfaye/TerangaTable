import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RulesEvaluator } from './rules.evaluator';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { ListRulesDto } from './dto/list-rules.dto';

@Injectable()
export class RulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evaluator: RulesEvaluator,
  ) {}

  // ── List ──────────────────────────────────────────────────────────────────

  async findAll(tenantId: string, query: ListRulesDto) {
    const { page = 1, limit = 50, event_trigger, is_active } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId };
    if (event_trigger) where['eventTrigger'] = event_trigger;
    if (is_active !== undefined) where['isActive'] = is_active;

    const [rules, total] = await Promise.all([
      this.prisma.rule.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.rule.count({ where }),
    ]);

    return {
      data: rules,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Detail ────────────────────────────────────────────────────────────────

  async findOne(tenantId: string, id: string) {
    const rule = await this.prisma.rule.findFirst({ where: { id, tenantId } });
    if (!rule) throw new NotFoundException(`Règle introuvable: ${id}`);
    return rule;
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async create(tenantId: string, dto: CreateRuleDto) {
    return this.prisma.rule.create({
      data: {
        tenantId,
        name: dto.name,
        eventTrigger: dto.event_trigger,
        conditions: (dto.conditions ?? []) as object[],
        conditionLogic: dto.condition_logic ?? 'AND',
        actions: (dto.actions ?? []) as object[],
        isActive: dto.is_active ?? true,
        priority: dto.priority ?? 0,
      },
    });
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async update(tenantId: string, id: string, dto: UpdateRuleDto) {
    await this.findOne(tenantId, id);

    return this.prisma.rule.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.event_trigger !== undefined && { eventTrigger: dto.event_trigger }),
        ...(dto.conditions !== undefined && { conditions: dto.conditions as object[] }),
        ...(dto.condition_logic !== undefined && { conditionLogic: dto.condition_logic }),
        ...(dto.actions !== undefined && { actions: dto.actions as object[] }),
        ...(dto.is_active !== undefined && { isActive: dto.is_active }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
      },
    });
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.prisma.rule.delete({ where: { id } });
    return { deleted: true };
  }

  // ── Toggle active ─────────────────────────────────────────────────────────

  async toggle(tenantId: string, id: string) {
    const rule = await this.findOne(tenantId, id);
    return this.prisma.rule.update({
      where: { id },
      data: { isActive: !rule.isActive },
    });
  }

  // ── Dry-run test ──────────────────────────────────────────────────────────

  async test(tenantId: string, id: string, payload: Record<string, unknown>) {
    const rule = await this.findOne(tenantId, id);

    const evaluable = {
      id: rule.id,
      name: rule.name,
      conditions: rule.conditions as unknown as Array<{
        field: string;
        operator: string;
        value?: unknown;
      }>,
      condition_logic: rule.conditionLogic as 'AND' | 'OR',
      actions: rule.actions as unknown as Array<{ type: string }>,
    };

    const { matched, conditionResults } = this.evaluator.evaluateRule(
      evaluable,
      payload,
    );

    return {
      matched,
      rule_name: rule.name,
      event_trigger: rule.eventTrigger,
      condition_logic: rule.conditionLogic,
      conditions: conditionResults.map((r) => ({
        field: r.field,
        operator: r.operator,
        value: r.value,
        result: r.result,
      })),
    };
  }
}
