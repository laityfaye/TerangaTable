import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { Prisma } from '@terangatable/database';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisCacheService } from '../../common/services/redis-cache.service';
import { AnalyticsQueryDto, RevenueQueryDto } from './dto/analytics-query.dto';

const CACHE_TTL = 300; // 5 minutes

// ── Period helpers ──────────────────────────────────────────────────────────

interface DateRange {
  from: Date;
  to: Date;
}

function getPeriodRange(query: AnalyticsQueryDto): DateRange {
  const now = new Date();

  if (query.period === 'today' || !query.period) {
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    return { from, to: now };
  }

  if (query.period === '7d') {
    const from = new Date(now);
    from.setDate(from.getDate() - 7);
    from.setHours(0, 0, 0, 0);
    return { from, to: now };
  }

  if (query.period === '30d') {
    const from = new Date(now);
    from.setDate(from.getDate() - 30);
    from.setHours(0, 0, 0, 0);
    return { from, to: now };
  }

  // custom
  return {
    from: query.date_from ? new Date(query.date_from) : new Date(now.setDate(now.getDate() - 30)),
    to: query.date_to ? new Date(query.date_to) : new Date(),
  };
}

function getPreviousPeriodRange(current: DateRange): DateRange {
  const duration = current.to.getTime() - current.from.getTime();
  return {
    from: new Date(current.from.getTime() - duration),
    to: new Date(current.from.getTime()),
  };
}

function variation(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return parseFloat((((current - previous) / previous) * 100).toFixed(1));
}

function toNumber(val: unknown): number {
  if (typeof val === 'bigint') return Number(val);
  if (typeof val === 'string') return parseFloat(val) || 0;
  if (typeof val === 'number') return val;
  if (val && typeof val === 'object' && 'toNumber' in val) return (val as { toNumber: () => number }).toNumber();
  return 0;
}

// ── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
  ) {}

  // ── Cache helpers ──────────────────────────────────────────────────────────

  private cacheKey(tenantId: string, endpoint: string, params: object): string {
    const hash = createHash('md5').update(JSON.stringify(params)).digest('hex').slice(0, 8);
    return `analytics:${tenantId}:${endpoint}:${hash}`;
  }

  private async cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const raw = await this.cache.client.get(key).catch(() => null);
    if (raw) {
      try {
        return JSON.parse(raw) as T;
      } catch {
        // ignore parse error, re-fetch
      }
    }
    const result = await fn();
    await this.cache.client.set(key, JSON.stringify(result), 'EX', CACHE_TTL).catch(() => null);
    return result;
  }

  async invalidateTenant(tenantId: string): Promise<void> {
    const pattern = `analytics:${tenantId}:*`;
    try {
      const keys = await this.cache.client.keys(pattern);
      if (keys.length > 0) await this.cache.client.del(...keys);
    } catch {
      // non-fatal
    }
  }

  // ── getSummary ─────────────────────────────────────────────────────────────

  async getSummary(tenantId: string, query: AnalyticsQueryDto) {
    const range = getPeriodRange(query);
    const prev = getPreviousPeriodRange(range);
    const key = this.cacheKey(tenantId, 'summary', { ...query });

    return this.cached(key, async () => {
      const [cur, prv] = await Promise.all([
        this.fetchSummaryMetrics(tenantId, range),
        this.fetchSummaryMetrics(tenantId, prev),
      ]);

      return {
        period: { from: range.from, to: range.to },
        orders_count: cur.ordersCount,
        revenue_total: cur.revenue,
        avg_order_value: cur.avgOrderValue,
        new_customers: cur.newCustomers,
        variations: {
          orders_count: variation(cur.ordersCount, prv.ordersCount),
          revenue_total: variation(cur.revenue, prv.revenue),
          avg_order_value: variation(cur.avgOrderValue, prv.avgOrderValue),
          new_customers: variation(cur.newCustomers, prv.newCustomers),
        },
      };
    });
  }

  private async fetchSummaryMetrics(tenantId: string, range: DateRange) {
    const [ordersRaw, customersRaw] = await Promise.all([
      this.prisma.$queryRaw<{ order_count: bigint; revenue: string; avg_value: string }[]>`
        SELECT
          COUNT(DISTINCT o.id)::bigint                          AS order_count,
          COALESCE(SUM(p.amount), 0)::text                     AS revenue,
          COALESCE(
            CASE WHEN COUNT(DISTINCT o.id) > 0
              THEN SUM(p.amount) / COUNT(DISTINCT o.id)
              ELSE 0
            END, 0
          )::text                                               AS avg_value
        FROM orders o
        LEFT JOIN payments p
          ON p.order_id = o.id
          AND p.tenant_id = ${tenantId}::uuid
          AND p.status = 'completed'
          AND p.created_at >= ${range.from}
          AND p.created_at < ${range.to}
        WHERE o.tenant_id = ${tenantId}::uuid
          AND o.created_at >= ${range.from}
          AND o.created_at < ${range.to}
      `,
      this.prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS count
        FROM customers
        WHERE tenant_id = ${tenantId}::uuid
          AND created_at >= ${range.from}
          AND created_at < ${range.to}
      `,
    ]);

    const row = ordersRaw[0];
    const ordersCount = toNumber(row?.order_count ?? 0);
    const revenue = toNumber(row?.revenue ?? '0');
    const avgOrderValue = toNumber(row?.avg_value ?? '0');
    const newCustomers = toNumber(customersRaw[0]?.count ?? 0);

    return { ordersCount, revenue, avgOrderValue, newCustomers };
  }

  // ── getRevenue ─────────────────────────────────────────────────────────────

  async getRevenue(tenantId: string, query: RevenueQueryDto) {
    const range = getPeriodRange(query);
    const prev = getPreviousPeriodRange(range);
    const key = this.cacheKey(tenantId, 'revenue', { ...query });

    const granularity = query.granularity ?? this.autoGranularity(range);

    return this.cached(key, async () => {
      const [current, previous] = await Promise.all([
        this.fetchRevenueSeries(tenantId, range, granularity),
        this.fetchRevenueSeries(tenantId, prev, granularity),
      ]);

      return {
        granularity,
        period: { from: range.from, to: range.to },
        current,
        previous,
      };
    });
  }

  private autoGranularity(range: DateRange): 'day' | 'week' | 'month' {
    const days = (range.to.getTime() - range.from.getTime()) / 86_400_000;
    if (days <= 1) return 'day';
    if (days <= 60) return 'day';
    if (days <= 180) return 'week';
    return 'month';
  }

  private async fetchRevenueSeries(tenantId: string, range: DateRange, granularity: 'day' | 'week' | 'month') {
    // Use Prisma.sql fragments so the truncation unit is embedded as SQL text,
    // not as a prepared-statement parameter. PostgreSQL cannot match a parameterized
    // DATE_TRUNC($1, col) expression between SELECT and GROUP BY at parse time.
    const truncExpr =
      granularity === 'week'
        ? Prisma.sql`DATE_TRUNC('week', p.created_at)::date`
        : granularity === 'month'
        ? Prisma.sql`DATE_TRUNC('month', p.created_at)::date`
        : Prisma.sql`DATE_TRUNC('day', p.created_at)::date`;

    const rows = await this.prisma.$queryRaw<{ date: Date; revenue: string; orders_count: bigint }[]>`
      SELECT
        ${truncExpr}                                  AS date,
        COALESCE(SUM(p.amount), 0)::text              AS revenue,
        COUNT(DISTINCT p.order_id)::bigint             AS orders_count
      FROM payments p
      WHERE p.tenant_id = ${tenantId}::uuid
        AND p.status = 'completed'
        AND p.created_at >= ${range.from}
        AND p.created_at < ${range.to}
      GROUP BY ${truncExpr}
      ORDER BY 1 ASC
    `;

    return rows.map((r) => ({
      date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date),
      revenue: toNumber(r.revenue),
      orders_count: toNumber(r.orders_count),
    }));
  }

  // ── getTopProducts ─────────────────────────────────────────────────────────

  async getTopProducts(tenantId: string, query: AnalyticsQueryDto) {
    const range = getPeriodRange(query);
    const key = this.cacheKey(tenantId, 'top-products', { ...query });

    return this.cached(key, async () => {
      const rows = await this.prisma.$queryRaw<{
        product_id: string;
        product_name: string;
        total_quantity: bigint;
        total_revenue: string;
      }[]>`
        SELECT
          oi.product_id,
          oi.product_name,
          SUM(oi.quantity)::bigint        AS total_quantity,
          COALESCE(SUM(oi.line_total), 0)::text  AS total_revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.tenant_id = ${tenantId}::uuid
          AND o.created_at >= ${range.from}
          AND o.created_at < ${range.to}
        GROUP BY oi.product_id, oi.product_name
        ORDER BY COALESCE(SUM(oi.line_total), 0) DESC
        LIMIT 10
      `;

      const totalRevenue = rows.reduce((s, r) => s + toNumber(r.total_revenue), 0);

      return {
        period: { from: range.from, to: range.to },
        items: rows.map((r) => {
          const rev = toNumber(r.total_revenue);
          return {
            product_id: r.product_id,
            product_name: r.product_name,
            total_quantity: toNumber(r.total_quantity),
            total_revenue: rev,
            revenue_pct: totalRevenue > 0 ? parseFloat(((rev / totalRevenue) * 100).toFixed(1)) : 0,
          };
        }),
      };
    });
  }

  // ── getPeakHours ───────────────────────────────────────────────────────────

  async getPeakHours(tenantId: string, days = 7) {
    const key = this.cacheKey(tenantId, 'peak-hours', { days });

    return this.cached(key, async () => {
      const rows = await this.prisma.$queryRaw<{
        day_of_week: number;
        hour: number;
        order_count: bigint;
      }[]>`
        SELECT
          EXTRACT(DOW FROM o.created_at)::int    AS day_of_week,
          EXTRACT(HOUR FROM o.created_at)::int   AS hour,
          COUNT(*)::bigint                        AS order_count
        FROM orders o
        WHERE o.tenant_id = ${tenantId}::uuid
          AND o.created_at >= NOW() - (${days} || ' days')::interval
        GROUP BY day_of_week, hour
        ORDER BY day_of_week, hour
      `;

      // Build 7×24 matrix initialized to 0 (DOW 0=Sunday → reorder to Mon=0..Sun=6)
      const matrix: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0) as number[]);

      for (const r of rows) {
        // DOW: 0=Sun,1=Mon,...,6=Sat → shift to Mon=0..Sun=6
        const dayIdx = (r.day_of_week + 6) % 7;
        const hourIdx = r.hour;
        if (dayIdx >= 0 && dayIdx < 7 && hourIdx >= 0 && hourIdx < 24) {
          matrix[dayIdx]![hourIdx] = toNumber(r.order_count);
        }
      }

      return {
        days,
        matrix,
        day_labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
      };
    });
  }

  // ── getOrderTypes ──────────────────────────────────────────────────────────

  async getOrderTypes(tenantId: string, query: AnalyticsQueryDto) {
    const range = getPeriodRange(query);
    const key = this.cacheKey(tenantId, 'order-types', { ...query });

    return this.cached(key, async () => {
      const rows = await this.prisma.$queryRaw<{
        type: string;
        count: bigint;
      }[]>`
        SELECT o.type, COUNT(*)::bigint AS count
        FROM orders o
        WHERE o.tenant_id = ${tenantId}::uuid
          AND o.created_at >= ${range.from}
          AND o.created_at < ${range.to}
        GROUP BY o.type
        ORDER BY count DESC
      `;

      const total = rows.reduce((s, r) => s + toNumber(r.count), 0);

      return {
        period: { from: range.from, to: range.to },
        total,
        items: rows.map((r) => {
          const count = toNumber(r.count);
          return {
            type: r.type,
            count,
            pct: total > 0 ? parseFloat(((count / total) * 100).toFixed(1)) : 0,
          };
        }),
      };
    });
  }

  // ── getStaff ───────────────────────────────────────────────────────────────

  async getStaff(tenantId: string, query: AnalyticsQueryDto) {
    const range = getPeriodRange(query);
    const key = this.cacheKey(tenantId, 'staff', { ...query });

    return this.cached(key, async () => {
      const rows = await this.prisma.$queryRaw<{
        agent_id: string;
        first_name: string;
        last_name: string;
        order_count: bigint;
        revenue: string;
      }[]>`
        SELECT
          o.agent_id,
          u.first_name,
          u.last_name,
          COUNT(*)::bigint                          AS order_count,
          COALESCE(SUM(o.total), 0)::text           AS revenue
        FROM orders o
        JOIN users u ON u.id = o.agent_id
        WHERE o.tenant_id = ${tenantId}::uuid
          AND o.created_at >= ${range.from}
          AND o.created_at < ${range.to}
          AND o.agent_id IS NOT NULL
        GROUP BY o.agent_id, u.first_name, u.last_name
        ORDER BY COALESCE(SUM(o.total), 0) DESC
      `;

      return {
        period: { from: range.from, to: range.to },
        items: rows.map((r) => ({
          agent_id: r.agent_id,
          name: `${r.first_name} ${r.last_name}`,
          order_count: toNumber(r.order_count),
          revenue: toNumber(r.revenue),
        })),
      };
    });
  }

  // ── getExportData ──────────────────────────────────────────────────────────

  async getExportData(tenantId: string, query: AnalyticsQueryDto) {
    const range = getPeriodRange(query);

    const rows = await this.prisma.$queryRaw<{
      order_number:    string;
      type:            string;
      status:          string;
      total:           string;
      paid_at:         Date | null;
      created_at:      Date;
      agent_first:     string;
      agent_last:      string;
      customer_first:  string;
      customer_last:   string;
      payment_methods: string | null;
    }[]>`
      SELECT
        o.order_number,
        o.type,
        o.status,
        o.total::text,
        o.paid_at,
        o.created_at,
        COALESCE(u.first_name, '')  AS agent_first,
        COALESCE(u.last_name,  '')  AS agent_last,
        COALESCE(c.first_name, '')  AS customer_first,
        COALESCE(c.last_name,  '')  AS customer_last,
        (
          SELECT STRING_AGG(DISTINCT p2.method, ' + ' ORDER BY p2.method)
          FROM payments p2
          WHERE p2.order_id = o.id AND p2.status = 'completed'
        ) AS payment_methods
      FROM orders o
      LEFT JOIN users     u ON u.id = o.agent_id
      LEFT JOIN customers c ON c.id = o.customer_id
      WHERE o.tenant_id = ${tenantId}::uuid
        AND o.created_at >= ${range.from}
        AND o.created_at < ${range.to}
      ORDER BY o.created_at DESC
    `;

    const TYPE_FR: Record<string, string> = {
      dine_in:  'Sur place',
      takeaway: 'À emporter',
      delivery: 'Livraison',
      online:   'En ligne',
    };

    const METHOD_FR: Record<string, string> = {
      cash:         'Espèces',
      card:         'Carte bancaire',
      mobile_money: 'Mobile Money',
      online:       'En ligne',
      voucher:      'Bon',
    };

    const STATUS_FR: Record<string, string> = {
      pending:   'En attente',
      cancelled: 'Annulée',
      completed: 'Terminée',
    };

    function fmtDate(d: Date | null): string {
      if (!d) return '';
      const p = (n: number) => String(n).padStart(2, '0');
      const dt = d instanceof Date ? d : new Date(d);
      return `${p(dt.getDate())}/${p(dt.getMonth() + 1)}/${dt.getFullYear()} ${p(dt.getHours())}:${p(dt.getMinutes())}`;
    }

    function translateMethods(raw: string | null): string {
      if (!raw) return '';
      return raw.split(' + ').map((m) => METHOD_FR[m] ?? m).join(' + ');
    }

    const SEP = ';';
    const headers = [
      'N° Commande',
      'Type',
      'Statut',
      'Client',
      'Agent',
      'Total (XOF)',
      'Mode de paiement',
      'Date de création',
      'Date de paiement',
    ];
    const lines = [headers.join(SEP)];

    for (const r of rows) {
      const cells = [
        r.order_number,
        TYPE_FR[r.type]   ?? r.type,
        STATUS_FR[r.status] ?? r.status,
        `${r.customer_first} ${r.customer_last}`.trim(),
        `${r.agent_first} ${r.agent_last}`.trim(),
        Math.round(toNumber(r.total)).toString(),
        translateMethods(r.payment_methods),
        fmtDate(r.created_at),
        fmtDate(r.paid_at),
      ];
      lines.push(cells.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(SEP));
    }

    return lines.join('\r\n');
  }
}
