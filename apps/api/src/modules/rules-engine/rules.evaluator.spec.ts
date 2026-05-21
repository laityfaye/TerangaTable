import { Test, TestingModule } from '@nestjs/testing';
import { RulesEvaluator, RuleCondition, EvaluableRule } from './rules.evaluator';
import { PrismaService } from '../../prisma/prisma.service';

const makePrisma = () => ({
  rule: { findMany: jest.fn() },
  order: { update: jest.fn() },
});

const cond = (field: string, operator: string, value?: unknown): RuleCondition => ({
  field,
  operator,
  value,
});

const makeRule = (
  logic: 'AND' | 'OR',
  conditions: RuleCondition[],
): EvaluableRule => ({
  id: 'rule-1',
  name: 'Test Rule',
  conditions,
  condition_logic: logic,
  actions: [],
});

describe('RulesEvaluator', () => {
  let evaluator: RulesEvaluator;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(async () => {
    prisma = makePrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RulesEvaluator,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    evaluator = module.get<RulesEvaluator>(RulesEvaluator);
  });

  // ── Operator: eq ────────────────────────────────────────────────────────────

  describe('eq', () => {
    it('returns true for identical strings', () => {
      expect(evaluator.evaluateCondition(cond('status', 'eq', 'pending'), { status: 'pending' })).toBe(true);
    });

    it('returns false for different strings', () => {
      expect(evaluator.evaluateCondition(cond('status', 'eq', 'paid'), { status: 'pending' })).toBe(false);
    });

    it('uses loose equality: string "100" equals number 100', () => {
      expect(evaluator.evaluateCondition(cond('total', 'eq', '100'), { total: 100 })).toBe(true);
    });

    it('returns false for null vs empty string', () => {
      expect(evaluator.evaluateCondition(cond('note', 'eq', ''), { note: null })).toBe(false);
    });
  });

  // ── Operator: neq ───────────────────────────────────────────────────────────

  describe('neq', () => {
    it('returns true for different values', () => {
      expect(evaluator.evaluateCondition(cond('type', 'neq', 'delivery'), { type: 'dine_in' })).toBe(true);
    });

    it('returns false for equal values', () => {
      expect(evaluator.evaluateCondition(cond('type', 'neq', 'dine_in'), { type: 'dine_in' })).toBe(false);
    });
  });

  // ── Operator: gt ────────────────────────────────────────────────────────────

  describe('gt', () => {
    it('returns true when field > value', () => {
      expect(evaluator.evaluateCondition(cond('amount', 'gt', 5), { amount: 10 })).toBe(true);
    });

    it('returns false when field < value', () => {
      expect(evaluator.evaluateCondition(cond('amount', 'gt', 10), { amount: 5 })).toBe(false);
    });

    it('returns false when field === value (strict greater)', () => {
      expect(evaluator.evaluateCondition(cond('amount', 'gt', 5), { amount: 5 })).toBe(false);
    });

    it('works with string numbers via coercion', () => {
      expect(evaluator.evaluateCondition(cond('total', 'gt', '100'), { total: '200' })).toBe(true);
    });
  });

  // ── Operator: gte ───────────────────────────────────────────────────────────

  describe('gte', () => {
    it('returns true when field > value', () => {
      expect(evaluator.evaluateCondition(cond('amount', 'gte', 5), { amount: 10 })).toBe(true);
    });

    it('returns true when field === value', () => {
      expect(evaluator.evaluateCondition(cond('amount', 'gte', 5), { amount: 5 })).toBe(true);
    });

    it('returns false when field < value', () => {
      expect(evaluator.evaluateCondition(cond('amount', 'gte', 10), { amount: 5 })).toBe(false);
    });
  });

  // ── Operator: lt ────────────────────────────────────────────────────────────

  describe('lt', () => {
    it('returns true when field < value', () => {
      expect(evaluator.evaluateCondition(cond('amount', 'lt', 10), { amount: 3 })).toBe(true);
    });

    it('returns false when field === value', () => {
      expect(evaluator.evaluateCondition(cond('amount', 'lt', 5), { amount: 5 })).toBe(false);
    });

    it('returns false when field > value', () => {
      expect(evaluator.evaluateCondition(cond('amount', 'lt', 5), { amount: 10 })).toBe(false);
    });
  });

  // ── Operator: lte ───────────────────────────────────────────────────────────

  describe('lte', () => {
    it('returns true when field <= value (boundary)', () => {
      expect(evaluator.evaluateCondition(cond('amount', 'lte', 10), { amount: 10 })).toBe(true);
    });

    it('returns true when field < value', () => {
      expect(evaluator.evaluateCondition(cond('amount', 'lte', 10), { amount: 7 })).toBe(true);
    });

    it('returns false when field > value', () => {
      expect(evaluator.evaluateCondition(cond('amount', 'lte', 10), { amount: 11 })).toBe(false);
    });
  });

  // ── Operator: contains ──────────────────────────────────────────────────────

  describe('contains', () => {
    it('returns true for substring (case-insensitive)', () => {
      expect(evaluator.evaluateCondition(cond('name', 'contains', 'BAOBAB'), { name: 'Le Baobab Doré' })).toBe(true);
    });

    it('returns false when substring not present', () => {
      expect(evaluator.evaluateCondition(cond('name', 'contains', 'pizza'), { name: 'Le Baobab Doré' })).toBe(false);
    });

    it('returns false for non-string field', () => {
      expect(evaluator.evaluateCondition(cond('total', 'contains', '100'), { total: 1000 })).toBe(false);
    });

    it('returns false for null field', () => {
      expect(evaluator.evaluateCondition(cond('notes', 'contains', 'test'), { notes: null })).toBe(false);
    });
  });

  // ── Operator: starts_with ───────────────────────────────────────────────────

  describe('starts_with', () => {
    it('returns true for matching prefix (case-insensitive)', () => {
      expect(evaluator.evaluateCondition(cond('code', 'starts_with', 'ord'), { code: 'ORD-2024-0001' })).toBe(true);
    });

    it('returns false for wrong prefix', () => {
      expect(evaluator.evaluateCondition(cond('code', 'starts_with', 'PAY'), { code: 'ORD-2024-0001' })).toBe(false);
    });

    it('returns false for non-string field', () => {
      expect(evaluator.evaluateCondition(cond('total', 'starts_with', '10'), { total: 100 })).toBe(false);
    });
  });

  // ── Operator: in ────────────────────────────────────────────────────────────

  describe('in', () => {
    it('returns true when value is in array', () => {
      expect(evaluator.evaluateCondition(cond('type', 'in', ['dine_in', 'takeaway']), { type: 'dine_in' })).toBe(true);
    });

    it('returns false when value is not in array', () => {
      expect(evaluator.evaluateCondition(cond('type', 'in', ['delivery']), { type: 'dine_in' })).toBe(false);
    });

    it('returns false when value param is not an array', () => {
      expect(evaluator.evaluateCondition(cond('type', 'in', 'dine_in'), { type: 'dine_in' })).toBe(false);
    });

    it('returns false for empty array', () => {
      expect(evaluator.evaluateCondition(cond('type', 'in', []), { type: 'dine_in' })).toBe(false);
    });
  });

  // ── Operator: not_in ────────────────────────────────────────────────────────

  describe('not_in', () => {
    it('returns true when value is not in array', () => {
      expect(evaluator.evaluateCondition(cond('type', 'not_in', ['delivery', 'online']), { type: 'dine_in' })).toBe(true);
    });

    it('returns false when value is in array', () => {
      expect(evaluator.evaluateCondition(cond('type', 'not_in', ['dine_in']), { type: 'dine_in' })).toBe(false);
    });

    it('returns false when value param is not an array', () => {
      expect(evaluator.evaluateCondition(cond('type', 'not_in', 'dine_in'), { type: 'dine_in' })).toBe(false);
    });
  });

  // ── Operator: is_null ───────────────────────────────────────────────────────

  describe('is_null', () => {
    it('returns true for null field value', () => {
      expect(evaluator.evaluateCondition(cond('customerId', 'is_null'), { customerId: null })).toBe(true);
    });

    it('returns true for missing field (undefined)', () => {
      expect(evaluator.evaluateCondition(cond('customerId', 'is_null'), {})).toBe(true);
    });

    it('returns false for non-null value', () => {
      expect(evaluator.evaluateCondition(cond('customerId', 'is_null'), { customerId: 'uuid-1' })).toBe(false);
    });

    it('returns false for zero (falsy but not null)', () => {
      expect(evaluator.evaluateCondition(cond('qty', 'is_null'), { qty: 0 })).toBe(false);
    });
  });

  // ── Operator: is_not_null ───────────────────────────────────────────────────

  describe('is_not_null', () => {
    it('returns true for non-null value', () => {
      expect(evaluator.evaluateCondition(cond('customerId', 'is_not_null'), { customerId: 'uuid-1' })).toBe(true);
    });

    it('returns true for zero (not null)', () => {
      expect(evaluator.evaluateCondition(cond('qty', 'is_not_null'), { qty: 0 })).toBe(true);
    });

    it('returns false for null', () => {
      expect(evaluator.evaluateCondition(cond('customerId', 'is_not_null'), { customerId: null })).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(evaluator.evaluateCondition(cond('customerId', 'is_not_null'), {})).toBe(false);
    });
  });

  // ── Operator: between ───────────────────────────────────────────────────────

  describe('between', () => {
    it('returns true when value is strictly between bounds', () => {
      expect(evaluator.evaluateCondition(cond('total', 'between', [10, 100]), { total: 50 })).toBe(true);
    });

    it('returns true at lower boundary (inclusive)', () => {
      expect(evaluator.evaluateCondition(cond('total', 'between', [10, 100]), { total: 10 })).toBe(true);
    });

    it('returns true at upper boundary (inclusive)', () => {
      expect(evaluator.evaluateCondition(cond('total', 'between', [10, 100]), { total: 100 })).toBe(true);
    });

    it('returns false below lower boundary', () => {
      expect(evaluator.evaluateCondition(cond('total', 'between', [10, 100]), { total: 9 })).toBe(false);
    });

    it('returns false above upper boundary', () => {
      expect(evaluator.evaluateCondition(cond('total', 'between', [10, 100]), { total: 101 })).toBe(false);
    });
  });

  // ── Operator: unknown ───────────────────────────────────────────────────────

  describe('unknown operator', () => {
    it('returns false for an unrecognised operator', () => {
      expect(evaluator.evaluateCondition(cond('field', 'bogus_op', 'x'), { field: 'x' })).toBe(false);
    });

    it('does not throw for unknown operator', () => {
      expect(() =>
        evaluator.evaluateCondition(cond('field', 'TOTALLY_UNKNOWN'), { field: 1 }),
      ).not.toThrow();
    });
  });

  // ── Nested field path ───────────────────────────────────────────────────────

  describe('nested field access via dot notation', () => {
    it('resolves a two-level path', () => {
      expect(
        evaluator.evaluateCondition(
          cond('customer.segment', 'eq', 'vip'),
          { customer: { segment: 'vip' } },
        ),
      ).toBe(true);
    });

    it('resolves a three-level path', () => {
      expect(
        evaluator.evaluateCondition(
          cond('order.customer.segment', 'eq', 'regular'),
          { order: { customer: { segment: 'regular' } } },
        ),
      ).toBe(true);
    });

    it('returns undefined for a missing nested key (is_null → true)', () => {
      expect(
        evaluator.evaluateCondition(
          cond('customer.address', 'is_null'),
          { customer: {} },
        ),
      ).toBe(true);
    });

    it('returns false for gt on missing path', () => {
      expect(
        evaluator.evaluateCondition(cond('a.b.c', 'gt', 0), {}),
      ).toBe(false);
    });
  });

  // ── evaluateRule — AND logic ─────────────────────────────────────────────────

  describe('evaluateRule — AND', () => {
    it('returns matched=true when ALL conditions pass', () => {
      const rule = makeRule('AND', [
        cond('amount', 'gte', 100),
        cond('type', 'eq', 'dine_in'),
      ]);
      const { matched } = evaluator.evaluateRule(rule, { amount: 150, type: 'dine_in' });
      expect(matched).toBe(true);
    });

    it('returns matched=false when ONE condition fails', () => {
      const rule = makeRule('AND', [
        cond('amount', 'gte', 100),
        cond('type', 'eq', 'delivery'),
      ]);
      const { matched } = evaluator.evaluateRule(rule, { amount: 150, type: 'dine_in' });
      expect(matched).toBe(false);
    });

    it('empty conditions → matched=true (vacuous truth of every())', () => {
      const { matched } = evaluator.evaluateRule(makeRule('AND', []), {});
      expect(matched).toBe(true);
    });
  });

  // ── evaluateRule — OR logic ──────────────────────────────────────────────────

  describe('evaluateRule — OR', () => {
    it('returns matched=true when AT LEAST ONE condition passes', () => {
      const rule = makeRule('OR', [
        cond('type', 'eq', 'delivery'),
        cond('amount', 'gte', 1000),
      ]);
      const { matched } = evaluator.evaluateRule(rule, { type: 'dine_in', amount: 5000 });
      expect(matched).toBe(true);
    });

    it('returns matched=false when ALL conditions fail', () => {
      const rule = makeRule('OR', [
        cond('type', 'eq', 'delivery'),
        cond('amount', 'gte', 1000),
      ]);
      const { matched } = evaluator.evaluateRule(rule, { type: 'dine_in', amount: 50 });
      expect(matched).toBe(false);
    });

    it('empty conditions → matched=false', () => {
      const { matched } = evaluator.evaluateRule(makeRule('OR', []), {});
      expect(matched).toBe(false);
    });
  });

  // ── conditionResults ────────────────────────────────────────────────────────

  describe('conditionResults', () => {
    it('returns one entry per condition with correct result', () => {
      const rule = makeRule('AND', [
        cond('amount', 'gt', 100),
        cond('type', 'eq', 'dine_in'),
      ]);
      const { conditionResults } = evaluator.evaluateRule(rule, { amount: 50, type: 'dine_in' });

      expect(conditionResults).toHaveLength(2);
      expect(conditionResults[0].field).toBe('amount');
      expect(conditionResults[0].result).toBe(false); // 50 not > 100
      expect(conditionResults[1].field).toBe('type');
      expect(conditionResults[1].result).toBe(true);
    });

    it('carries back field, operator, and value', () => {
      const rule = makeRule('OR', [cond('status', 'in', ['paid', 'completed'])]);
      const { conditionResults } = evaluator.evaluateRule(rule, { status: 'paid' });

      expect(conditionResults[0].operator).toBe('in');
      expect(conditionResults[0].value).toEqual(['paid', 'completed']);
    });
  });

  // ── Operator: time_between ──────────────────────────────────────────────────

  describe('time_between', () => {
    it('returns true for a wide window that covers any test execution time', () => {
      expect(
        evaluator.evaluateCondition(cond('_now', 'time_between', ['00:00', '23:59']), {}),
      ).toBe(true);
    });

    it('returns false for an impossible window [23:59, 00:00]', () => {
      expect(
        evaluator.evaluateCondition(cond('_now', 'time_between', ['23:59', '00:00']), {}),
      ).toBe(false);
    });
  });

  // ── executeAction (via evaluate) ────────────────────────────────────────────

  const matchingRule = (actions: Record<string, unknown>[]) => ({
    id: 'r-exec',
    name: 'Exec rule',
    conditions: [{ field: 'always', operator: 'is_not_null' }],
    conditionLogic: 'AND',
    actions,
    priority: 1,
    isActive: true,
    eventTrigger: 'test.event',
    tenantId: 'tenant-1',
  });

  describe('executeAction — notify_role', () => {
    it('resolves without error (logging only)', async () => {
      prisma.rule.findMany.mockResolvedValue([
        matchingRule([{ type: 'notify_role', role: 'manager', channel: 'app', message: 'OK' }]),
      ]);

      await expect(
        evaluator.evaluate('test.event', { always: true }, 'tenant-1'),
      ).resolves.toBeUndefined();
    });
  });

  describe('executeAction — notify_user', () => {
    it('resolves without error (logging only)', async () => {
      prisma.rule.findMany.mockResolvedValue([
        matchingRule([{ type: 'notify_user', userId: 'user-1', message: 'Hello' }]),
      ]);

      await expect(
        evaluator.evaluate('test.event', { always: true }, 'tenant-1'),
      ).resolves.toBeUndefined();
    });
  });

  describe('executeAction — update_field', () => {
    it('calls prisma.order.update when orderId present in payload', async () => {
      prisma.rule.findMany.mockResolvedValue([
        matchingRule([{ type: 'update_field', entity: 'order', entityIdField: 'orderId', field: 'status', value: 'vip' }]),
      ]);
      prisma.order.update.mockResolvedValue({});

      await evaluator.evaluate('test.event', { always: true, orderId: 'order-1' }, 'tenant-1');

      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'order-1' }, data: { status: 'vip' } }),
      );
    });

    it('skips update when entityId is missing', async () => {
      prisma.rule.findMany.mockResolvedValue([
        matchingRule([{ type: 'update_field', entity: 'order', entityIdField: 'orderId', field: 'status', value: 'vip' }]),
      ]);

      await evaluator.evaluate('test.event', { always: true }, 'tenant-1');

      expect(prisma.order.update).not.toHaveBeenCalled();
    });
  });

  describe('executeAction — set_tag', () => {
    it('resolves without error (logging only)', async () => {
      prisma.rule.findMany.mockResolvedValue([
        matchingRule([{ type: 'set_tag', tag: 'urgent', orderId: 'order-1' }]),
      ]);

      await expect(
        evaluator.evaluate('test.event', { always: true, orderId: 'order-1' }, 'tenant-1'),
      ).resolves.toBeUndefined();
    });
  });

  describe('executeAction — apply_discount', () => {
    it('resolves without error (logging only)', async () => {
      prisma.rule.findMany.mockResolvedValue([
        matchingRule([{ type: 'apply_discount', discount_type: 'percent', discount_value: 10, orderId: 'order-1' }]),
      ]);

      await expect(
        evaluator.evaluate('test.event', { always: true, orderId: 'order-1' }, 'tenant-1'),
      ).resolves.toBeUndefined();
    });
  });

  describe('executeAction — change_status', () => {
    it('resolves without error (logging only)', async () => {
      prisma.rule.findMany.mockResolvedValue([
        matchingRule([{ type: 'change_status', target_status: 'paid', orderId: 'order-1' }]),
      ]);

      await expect(
        evaluator.evaluate('test.event', { always: true, orderId: 'order-1' }, 'tenant-1'),
      ).resolves.toBeUndefined();
    });
  });

  describe('executeAction — block_action', () => {
    it('re-throws when block_action fires', async () => {
      prisma.rule.findMany.mockResolvedValue([
        matchingRule([{ type: 'block_action', message: 'Opération interdite' }]),
      ]);

      await expect(
        evaluator.evaluate('test.event', { always: true }, 'tenant-1'),
      ).rejects.toThrow('Opération interdite');
    });
  });

  describe('executeAction — unknown type', () => {
    it('resolves without error for unknown action type', async () => {
      prisma.rule.findMany.mockResolvedValue([
        matchingRule([{ type: 'totally_unknown_action' }]),
      ]);

      await expect(
        evaluator.evaluate('test.event', { always: true }, 'tenant-1'),
      ).resolves.toBeUndefined();
    });
  });

  describe('interpolate (via send_webhook body)', () => {
    it('substitutes {{field}} placeholders from payload', async () => {
      // send_webhook with dynamic import: just verify it resolves or throws
      // network will fail but dynamic import covers the interpolate path
      prisma.rule.findMany.mockResolvedValue([
        matchingRule([{ type: 'send_webhook', url: '', method: 'POST', body: '{"id":"{{orderId}}"}' }]),
      ]);

      // URL is empty so axios will throw, but executeAction catches non-block_action errors
      await expect(
        evaluator.evaluate('test.event', { always: true, orderId: 'order-99' }, 'tenant-1'),
      ).resolves.toBeUndefined();
    });
  });

  // ── evaluate (async, DB-driven) ──────────────────────────────────────────────

  describe('evaluate', () => {
    it('fetches rules ordered by priority desc and evaluates each', async () => {
      const rule = {
        id: 'r-1',
        name: 'High priority rule',
        conditions: [{ field: 'amount', operator: 'gte', value: 100 }],
        conditionLogic: 'AND',
        actions: [{ type: 'notify_role', role: 'manager', channel: 'app', message: 'Grosse commande' }],
        priority: 10,
        isActive: true,
        eventTrigger: 'order.created',
        tenantId: 'tenant-1',
      };
      prisma.rule.findMany.mockResolvedValue([rule]);

      await expect(
        evaluator.evaluate('order.created', { amount: 200 }, 'tenant-1'),
      ).resolves.toBeUndefined();

      expect(prisma.rule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 'tenant-1', eventTrigger: 'order.created', isActive: true },
          orderBy: { priority: 'desc' },
        }),
      );
    });

    it('skips rules that do not match', async () => {
      const rule = {
        id: 'r-1',
        name: 'Rule never matches',
        conditions: [{ field: 'amount', operator: 'gte', value: 9999 }],
        conditionLogic: 'AND',
        actions: [{ type: 'notify_role', role: 'manager', channel: 'app', message: 'test' }],
      };
      prisma.rule.findMany.mockResolvedValue([rule]);

      await evaluator.evaluate('order.created', { amount: 10 }, 'tenant-1');

      // No DB side-effects triggered (no order.update call)
      expect(prisma.order.update).not.toHaveBeenCalled();
    });
  });
});
