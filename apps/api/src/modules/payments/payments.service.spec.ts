import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentMethodEnum } from './dto/create-payment.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisCacheService } from '../../common/services/redis-cache.service';
import { PaymentPublisher } from '../../events/publishers/payment.publisher';

const TENANT_ID  = 'tenant-1';
const ORDER_ID   = 'order-1';
const PAYMENT_ID = 'payment-1';

const makePayment = (overrides: Record<string, unknown> = {}) => ({
  id: PAYMENT_ID,
  orderId: ORDER_ID,
  tenantId: TENANT_ID,
  method: PaymentMethodEnum.cash,
  amount: '3500',
  reference: null,
  status: 'completed',
  metadata: {},
  createdAt: new Date(),
  ...overrides,
});

const makeOrder = (total: string, completedAmounts: string[]) => ({
  id: ORDER_ID,
  tenantId: TENANT_ID,
  total,
  status: 'pending',
  payments: completedAmounts.map((amount) => ({ amount })),
});

const makePrisma = () => ({
  order: { findFirst: jest.fn(), update: jest.fn() },
  payment: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  workflowState: { findFirst: jest.fn() },
  $transaction: jest.fn(),
});

const makeRedis = () => ({
  client: {
    keys: jest.fn().mockResolvedValue([]),
    del: jest.fn().mockResolvedValue(0),
  },
});

const makePublisher = () => ({
  publish: jest.fn().mockResolvedValue(undefined),
});

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: ReturnType<typeof makePrisma>;
  let publisher: ReturnType<typeof makePublisher>;

  beforeEach(async () => {
    prisma = makePrisma();
    publisher = makePublisher();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisCacheService, useValue: makeRedis() },
        { provide: PaymentPublisher, useValue: publisher },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  // ── createPayment ────────────────────────────────────────────────────────────

  describe('createPayment', () => {
    it('throws NotFoundException when order not found for tenant', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(
        service.createPayment(TENANT_ID, { order_id: ORDER_ID, method: PaymentMethodEnum.cash, amount: 100 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when payment exceeds remaining balance', async () => {
      // Order total 1000, already paid 800 → remaining 200
      prisma.order.findFirst.mockResolvedValue(makeOrder('1000', ['800']));

      await expect(
        service.createPayment(TENANT_ID, { order_id: ORDER_ID, method: PaymentMethodEnum.cash, amount: 300 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates payment and returns mapped result', async () => {
      prisma.order.findFirst.mockResolvedValue(makeOrder('3500', []));
      prisma.payment.create.mockResolvedValue(makePayment());
      prisma.workflowState.findFirst.mockResolvedValue(null);

      const result = await service.createPayment(TENANT_ID, {
        order_id: ORDER_ID,
        method: PaymentMethodEnum.cash,
        amount: 3500,
      });

      expect(result.amount).toBe(3500);
      expect(result.method).toBe('cash');
      expect(result.status).toBe('completed');
      expect(publisher.publish).toHaveBeenCalledWith(
        'payment.received',
        expect.objectContaining({ isFullyPaid: true }),
      );
    });

    it('correctly computes remaining: total=5000, paid=2000, remaining=3000', async () => {
      prisma.order.findFirst.mockResolvedValue(makeOrder('5000', ['2000']));
      prisma.payment.create.mockResolvedValue(makePayment({ amount: '2500' }));
      prisma.workflowState.findFirst.mockResolvedValue(null);

      // 2500 ≤ 3000 remaining → should succeed
      await expect(
        service.createPayment(TENANT_ID, { order_id: ORDER_ID, method: PaymentMethodEnum.mobile_money, amount: 2500 }),
      ).resolves.toBeTruthy();
    });

    it('marks order as paid (paidAt + status=paid) when fully paid in one shot', async () => {
      prisma.order.findFirst.mockResolvedValue(makeOrder('3500', []));
      prisma.payment.create.mockResolvedValue(makePayment());
      prisma.workflowState.findFirst.mockResolvedValue({ id: 'paid-state' });
      prisma.order.update.mockResolvedValue({});

      await service.createPayment(TENANT_ID, { order_id: ORDER_ID, method: PaymentMethodEnum.cash, amount: 3500 });

      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: ORDER_ID },
          data: expect.objectContaining({
            status: 'paid',
            paidAt: expect.any(Date),
            workflowStateId: 'paid-state',
          }),
        }),
      );
    });

    it('does NOT mark order as paid for partial payment', async () => {
      prisma.order.findFirst.mockResolvedValue(makeOrder('5000', []));
      prisma.payment.create.mockResolvedValue(makePayment({ amount: '2000' }));
      prisma.workflowState.findFirst.mockResolvedValue(null);

      await service.createPayment(TENANT_ID, { order_id: ORDER_ID, method: PaymentMethodEnum.cash, amount: 2000 });

      expect(prisma.order.update).not.toHaveBeenCalled();
      expect(publisher.publish).toHaveBeenCalledWith(
        'payment.received',
        expect.objectContaining({ isFullyPaid: false }),
      );
    });

    it('mixed payment: cash 2000 + mobile_money 3000 = fully paid 5000', async () => {
      // First payment: 2000/5000
      prisma.order.findFirst
        .mockResolvedValueOnce(makeOrder('5000', []))
        // Second payment: 3000/5000 with 2000 already paid
        .mockResolvedValueOnce(makeOrder('5000', ['2000']));

      prisma.payment.create
        .mockResolvedValueOnce(makePayment({ amount: '2000' }))
        .mockResolvedValueOnce(makePayment({ id: 'pay-2', amount: '3000' }));

      prisma.workflowState.findFirst
        .mockResolvedValueOnce(null)             // partial — no state change
        .mockResolvedValueOnce({ id: 'paid-state' }); // full — transitions

      // 1st payment: partial, no order.update
      await service.createPayment(TENANT_ID, { order_id: ORDER_ID, method: PaymentMethodEnum.cash, amount: 2000 });
      expect(prisma.order.update).not.toHaveBeenCalled();

      // 2nd payment: completes the total, order.update called
      await service.createPayment(TENANT_ID, { order_id: ORDER_ID, method: PaymentMethodEnum.mobile_money, amount: 3000 });
      expect(prisma.order.update).toHaveBeenCalledTimes(1);
    });

    it('allows payment within floating-point tolerance (0.001)', async () => {
      // total 99.99, alreadyPaid 0 → remaining 99.99
      // amount 99.99 — should pass (exact match within tolerance)
      prisma.order.findFirst.mockResolvedValue(makeOrder('99.99', []));
      prisma.payment.create.mockResolvedValue(makePayment({ amount: '99.99' }));
      prisma.workflowState.findFirst.mockResolvedValue(null);

      await expect(
        service.createPayment(TENANT_ID, { order_id: ORDER_ID, method: PaymentMethodEnum.card, amount: 99.99 }),
      ).resolves.toBeTruthy();
    });

    it('IDOR: tenant B cannot pay for tenant A order', async () => {
      // findFirst with tenantId:'tenant-B' returns null for tenant-A's order
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(
        service.createPayment('tenant-B', { order_id: ORDER_ID, method: PaymentMethodEnum.cash, amount: 100 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── refund ──────────────────────────────────────────────────────────────────

  describe('refund', () => {
    it('throws NotFoundException when payment not found', async () => {
      prisma.payment.findFirst.mockResolvedValue(null);

      await expect(service.refund(TENANT_ID, PAYMENT_ID, {})).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when payment already refunded', async () => {
      prisma.payment.findFirst.mockResolvedValue(makePayment({ status: 'refunded' }));

      await expect(service.refund(TENANT_ID, PAYMENT_ID, {})).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when payment is not completed (pending)', async () => {
      prisma.payment.findFirst.mockResolvedValue(makePayment({ status: 'pending' }));

      await expect(service.refund(TENANT_ID, PAYMENT_ID, {})).rejects.toThrow(BadRequestException);
    });

    it('creates refund entry with negative amount and publishes event', async () => {
      const original = makePayment({ amount: '1500' });
      prisma.payment.findFirst.mockResolvedValue(original);

      const updatedOriginal = makePayment({ status: 'refunded' });
      const refundEntry = makePayment({ id: 'refund-1', amount: '-1500', status: 'refunded' });
      prisma.$transaction.mockResolvedValue([updatedOriginal, refundEntry]);

      const result = await service.refund(TENANT_ID, PAYMENT_ID, { reason: 'Client request' });

      expect(result.refunded).toBe(true);
      expect(result.refund_payment.amount).toBe(-1500);
      expect(publisher.publish).toHaveBeenCalledWith('payment.refunded', expect.any(Object));
    });

    it('passes reason through to refund metadata', async () => {
      prisma.payment.findFirst.mockResolvedValue(makePayment({ amount: '500' }));
      prisma.$transaction.mockImplementation((ops: unknown[]) =>
        Promise.all((ops as Promise<unknown>[]).map((op) => op)),
      );
      prisma.payment.update.mockResolvedValue(makePayment({ status: 'refunded' }));
      prisma.payment.create.mockResolvedValue(
        makePayment({ id: 'ref-1', amount: '-500', status: 'refunded' }),
      );

      await service.refund(TENANT_ID, PAYMENT_ID, { reason: 'Erreur de saisie' });

      const createCall = prisma.payment.create.mock.calls[0][0] as {
        data: { metadata: { reason: string } };
      };
      expect(createCall.data.metadata.reason).toBe('Erreur de saisie');
    });
  });

  // ── getSummary ───────────────────────────────────────────────────────────────

  describe('getSummary', () => {
    it('aggregates total and by_method correctly', async () => {
      prisma.payment.findMany.mockResolvedValue([
        { method: PaymentMethodEnum.cash, amount: '1000', createdAt: new Date() },
        { method: PaymentMethodEnum.cash, amount: '500', createdAt: new Date() },
        { method: PaymentMethodEnum.mobile_money, amount: '2000', createdAt: new Date() },
      ]);

      const result = await service.getSummary(TENANT_ID, {});

      expect(result.total).toBeCloseTo(3500);
      expect(result.by_method['cash']).toBeCloseTo(1500);
      expect(result.by_method['mobile_money']).toBeCloseTo(2000);
      expect(result.count).toBe(3);
    });

    it('returns zero totals when no payments', async () => {
      prisma.payment.findMany.mockResolvedValue([]);

      const result = await service.getSummary(TENANT_ID, {});

      expect(result.total).toBe(0);
      expect(result.count).toBe(0);
    });

    it('filters by date range when provided', async () => {
      prisma.payment.findMany.mockResolvedValue([]);

      await service.getSummary(TENANT_ID, { date_from: '2024-01-01', date_to: '2024-01-31' });

      const findCall = prisma.payment.findMany.mock.calls[0][0] as {
        where: Record<string, unknown>;
      };
      expect(findCall.where['createdAt']).toMatchObject({
        gte: expect.any(Date),
        lte: expect.any(Date),
      });
    });
  });

  // ── findOne ──────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns mapped payment when found', async () => {
      prisma.payment.findFirst.mockResolvedValue({
        ...makePayment(),
        order: { id: ORDER_ID, orderNumber: 'ORD-2024-0001' },
      });

      const result = await service.findOne(TENANT_ID, PAYMENT_ID);

      expect(result.id).toBe(PAYMENT_ID);
      expect(result.amount).toBe(3500);
      expect(result.order?.order_number).toBe('ORD-2024-0001');
    });

    it('throws NotFoundException when not found', async () => {
      prisma.payment.findFirst.mockResolvedValue(null);

      await expect(service.findOne(TENANT_ID, PAYMENT_ID)).rejects.toThrow(NotFoundException);
    });
  });
});
