import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface RuleCondition {
  field: string;
  operator: string;
  value?: unknown;
}

export interface RuleAction {
  type: string;
  [key: string]: unknown;
}

export interface EvaluableRule {
  id: string;
  name: string;
  conditions: RuleCondition[];
  condition_logic: 'AND' | 'OR';
  actions: RuleAction[];
}

export interface ConditionEvalResult {
  field: string;
  operator: string;
  value?: unknown;
  result: boolean;
}

@Injectable()
export class RulesEvaluator {
  private readonly logger = new Logger(RulesEvaluator.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Public: called by consumer for each incoming event ────────────────────

  async evaluate(
    event: string,
    payload: Record<string, unknown>,
    tenantId: string,
  ): Promise<void> {
    const rules = await this.prisma.rule.findMany({
      where: { tenantId, eventTrigger: event, isActive: true },
      orderBy: { priority: 'desc' },
    });

    this.logger.log(
      `Event "${event}" → ${rules.length} règle(s) active(s) pour tenant ${tenantId}`,
    );

    for (const rule of rules) {
      const evaluable: EvaluableRule = {
        id: rule.id,
        name: rule.name,
        conditions: rule.conditions as unknown as RuleCondition[],
        condition_logic: rule.conditionLogic as 'AND' | 'OR',
        actions: rule.actions as unknown as RuleAction[],
      };

      const { matched, conditionResults } = this.evaluateRule(evaluable, payload);

      const summary = conditionResults
        .map(c => `${c.field} ${c.operator} → ${c.result ? '✓' : '✗'}`)
        .join(' | ');

      this.logger.log(
        `Règle "${rule.name}" [${matched ? '✅ MATCH' : '❌ SKIP'}] — ${summary}`,
      );

      if (matched) {
        for (const action of evaluable.actions) {
          await this.executeAction(action, payload, tenantId);
        }
      }
    }
  }

  // ── Public: called by service for dry-run test ────────────────────────────

  evaluateRule(
    rule: EvaluableRule,
    payload: Record<string, unknown>,
  ): { matched: boolean; conditionResults: ConditionEvalResult[] } {
    const conditionResults: ConditionEvalResult[] = rule.conditions.map((c) => ({
      field: c.field,
      operator: c.operator,
      value: c.value,
      result: this.evaluateCondition(c, payload),
    }));

    const matched =
      rule.condition_logic === 'AND'
        ? conditionResults.every((r) => r.result)
        : conditionResults.length === 0
          ? false
          : conditionResults.some((r) => r.result);

    return { matched, conditionResults };
  }

  // ── Condition evaluation ──────────────────────────────────────────────────

  evaluateCondition(
    condition: RuleCondition,
    payload: Record<string, unknown>,
  ): boolean {
    const { field, operator, value } = condition;
    const fieldVal = this.getFieldValue(field, payload);

    try {
      switch (operator) {
        case 'eq':
          // eslint-disable-next-line eqeqeq
          return fieldVal == value;
        case 'neq':
          // eslint-disable-next-line eqeqeq
          return fieldVal != value;
        case 'gt':
          return Number(fieldVal) > Number(value);
        case 'gte':
          return Number(fieldVal) >= Number(value);
        case 'lt':
          return Number(fieldVal) < Number(value);
        case 'lte':
          return Number(fieldVal) <= Number(value);
        case 'contains':
          return (
            typeof fieldVal === 'string' &&
            fieldVal.toLowerCase().includes(String(value).toLowerCase())
          );
        case 'starts_with':
          return (
            typeof fieldVal === 'string' &&
            fieldVal.toLowerCase().startsWith(String(value).toLowerCase())
          );
        case 'in':
          return Array.isArray(value) && value.includes(fieldVal);
        case 'not_in':
          return Array.isArray(value) && !value.includes(fieldVal);
        case 'is_null':
          return fieldVal === null || fieldVal === undefined;
        case 'is_not_null':
          return fieldVal !== null && fieldVal !== undefined;
        case 'between': {
          const [min, max] = value as [number, number];
          const n = Number(fieldVal);
          return n >= min && n <= max;
        }
        case 'time_between': {
          // value = ["HH:MM", "HH:MM"] 24h
          const [startTime, endTime] = value as [string, string];
          const now = new Date();
          const current =
            String(now.getHours()).padStart(2, '0') +
            ':' +
            String(now.getMinutes()).padStart(2, '0');
          return current >= startTime && current <= endTime;
        }
        default:
          this.logger.warn(`Opérateur inconnu: "${operator}"`);
          return false;
      }
    } catch {
      this.logger.warn(`Erreur évaluation condition ${field} ${operator}: `);
      return false;
    }
  }

  // ── Action execution ──────────────────────────────────────────────────────

  private async executeAction(
    action: RuleAction,
    payload: Record<string, unknown>,
    _tenantId: string,
  ): Promise<void> {
    const { type } = action;

    try {
      switch (type) {
        case 'notify_role':
          this.logger.log(
            `[NOTIFY_ROLE] role=${String(action['role'])} channel=${String(action['channel'])}: ${String(action['message'])}`,
          );
          break;

        case 'notify_user':
          this.logger.log(
            `[NOTIFY_USER] user=${String(action['userId'])}: ${String(action['message'])}`,
          );
          break;

        case 'update_field': {
          const idField = (action['entityIdField'] as string) ?? 'orderId';
          const entityId = this.getFieldValue(idField, payload) as string;
          if (!entityId) {
            this.logger.warn(`[UPDATE_FIELD] entityId introuvable dans le payload (field: ${idField})`);
            break;
          }
          const entity = action['entity'] as string;
          const field = action['field'] as string;
          const val = action['value'];
          if (entity === 'order') {
            await this.prisma.order.update({ where: { id: entityId }, data: { [field]: val } });
            this.logger.log(`[UPDATE_FIELD] order.${field} = ${String(val)} sur ${entityId}`);
          }
          break;
        }

        case 'set_tag': {
          const entityId = this.getFieldValue('orderId', payload) as string ?? this.getFieldValue('id', payload) as string;
          this.logger.log(`[SET_TAG] entity=${entityId} tag=${String(action['tag'])}`);
          break;
        }

        case 'apply_discount': {
          const orderId =
            (this.getFieldValue('orderId', payload) as string) ??
            (this.getFieldValue('id', payload) as string);
          if (!orderId) { this.logger.warn('[APPLY_DISCOUNT] orderId introuvable'); break; }
          const discountType = action['discount_type'] as string;
          const discountValue = action['discount_value'] as number;
          this.logger.log(
            `[APPLY_DISCOUNT] order=${orderId} type=${discountType} valeur=${discountValue}`,
          );
          break;
        }

        case 'change_status': {
          const orderId = this.getFieldValue('orderId', payload) as string;
          if (!orderId) { this.logger.warn('[CHANGE_STATUS] orderId introuvable'); break; }
          this.logger.log(`[CHANGE_STATUS] order=${orderId} → ${String(action['target_status'])}`);
          break;
        }

        case 'send_webhook': {
          const url = action['url'] as string;
          if (!url) { this.logger.warn('[SEND_WEBHOOK] URL manquante'); break; }
          const method = ((action['method'] as string) ?? 'POST').toUpperCase();
          const rawBody = (action['body'] as string) ?? '{}';
          const body = this.interpolate(rawBody, payload);
          this.logger.log(`[SEND_WEBHOOK] ${method} ${url}`);

          // Dynamic import to avoid forcing axios dep if unused
          const { default: axios } = await import('axios');
          if (method === 'POST') {
            await axios.post(url, JSON.parse(body), { timeout: 8000 });
          } else if (method === 'GET') {
            await axios.get(url, { timeout: 8000 });
          } else if (method === 'PUT') {
            await axios.put(url, JSON.parse(body), { timeout: 8000 });
          }
          break;
        }

        case 'block_action': {
          const message =
            (action['message'] as string) ?? 'Action bloquée par une règle métier';
          this.logger.warn(`[BLOCK_ACTION] ${message}`);
          throw new Error(message);
        }

        default:
          this.logger.warn(`[ACTION_INCONNUE] type="${type}"`);
      }
    } catch (err) {
      // Re-throw block_action so callers can react
      if (type === 'block_action') throw err;
      this.logger.error(
        `Action "${type}" échouée: ${(err as Error).message}`,
      );
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private getFieldValue(field: string, payload: Record<string, unknown>): unknown {
    return field.split('.').reduce((acc: unknown, key: string) => {
      if (acc !== null && acc !== undefined && typeof acc === 'object') {
        return (acc as Record<string, unknown>)[key];
      }
      return undefined;
    }, payload);
  }

  private interpolate(template: string, payload: Record<string, unknown>): string {
    return template.replace(/\{\{([\w.]+)\}\}/g, (_, key: string) => {
      const val = this.getFieldValue(key, payload);
      return val !== undefined ? String(val) : '';
    });
  }
}
