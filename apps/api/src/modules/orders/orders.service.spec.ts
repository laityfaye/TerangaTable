import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkflowEngine } from '../workflows/workflow.engine';
import { OrderPublisher } from '../../events/publishers/order.publisher';

const TENANT_ID = 'tenant-uuid-1';
const USER_ID   = 'user-uuid-1';
const ORDER_ID  = 'order-uuid-1';
const PRODUCT_ID = 'product-uuid-1';
const STATE_ID   = 'state-uuid-1';
const YEAR = new Date().getFullYear();

const mockState = { id: STATE_ID, name: 'En attente', color: '#FFA500', slug: 'pending', sortOrder: 0 };

const mockProduct = {
  id: PRODUCT_ID,
  name: 'Thiéboudienne',
  basePrice: '3500',
  isAvailable: true,
};

const mockOrder = {
  id: ORDER_ID,
  tenantId: TENANT_ID,
  orderNumber: `ORD-${YEAR}-0001`,
  type: 'dine_in',
  status: 'pending',
  workflowStateId: STATE_ID,
  workflowState: mockState,
  customer: null,
  agent: null,
  table: null,
  subtotal: '3500',
  taxAmount: '0',
  discountAmount: '0',
  total: '3500',
  notes: null,
  deliveryAddress: null,
  paidAt: null,
  createdAt: new Date(),
  items: [],
  payments: [],
};

const makePrisma = () => ({
  workflowDefinition: { findFirst: jest.fn() },
  product: { findMany: jest.fn(), findFirst: jest.fn() },
  order: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  workflowState: { findFirst: jest.fn(), findUnique: jest.fn() },
  orderItem: { findFirst: jest.fn() },
  $transaction: jest.fn(),
});

const makeEngine = () => ({
  getAvailableTransitions: jest.fn(),
  executeTransition: jest.fn(),
});

const makePublisher = () => ({
  publish: jest.fn().mockResolvedValue(undefined),
});

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: ReturnType<typeof makePrisma>;
  let engine: ReturnType<typeof makeEngine>;
  let publisher: ReturnType<typeof makePublisher>;

  beforeEach(async () => {
    prisma = makePrisma();
    engine = makeEngine();
    publisher = makePublisher();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: WorkflowEngine, useValue: engine },
        { provide: OrderPublisher, useValue: publisher },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    const baseDto = {
      type: 'dine_in' as const,
      items: [{ product_id: PRODUCT_ID, quantity: 1 }],
    };

    it('throws BadRequestException when no default workflow exists', async () => {
      prisma.workflowDefinition.findFirst.mockResolvedValue(null);

      await expect(service.create(TENANT_ID, USER_ID, baseDto)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when workflow has no initial state', async () => {
      prisma.workflowDefinition.findFirst.mockResolvedValue({ states: [] });

      await expect(service.create(TENANT_ID, USER_ID, baseDto)).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when product does not exist for tenant', async () => {
      prisma.workflowDefinition.findFirst.mockResolvedValue({
        states: [{ id: STATE_ID, isInitial: true }],
      });
      prisma.product.findMany.mockResolvedValue([]); // product not found

      await expect(service.create(TENANT_ID, USER_ID, baseDto)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when product is unavailable', async () => {
      prisma.workflowDefinition.findFirst.mockResolvedValue({
        states: [{ id: STATE_ID, isInitial: true }],
      });
      prisma.product.findMany.mockResolvedValue([{ ...mockProduct, isAvailable: false }]);

      await expect(service.create(TENANT_ID, USER_ID, baseDto)).rejects.toThrow(BadRequestException);
    });

    it('generates ORD-{year}-0001 when no previous order exists', async () => {
      prisma.workflowDefinition.findFirst.mockResolvedValue({
        states: [{ id: STATE_ID, isInitial: true }],
      });
      prisma.product.findMany.mockResolvedValue([mockProduct]);

      const txOrder = { ...mockOrder, orderNumber: `ORD-${YEAR}-0001` };
      const txMock = {
        order: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue(txOrder),
        },
      };
      prisma.$transaction.mockImplementationOnce(
        (fn: (tx: unknown) => Promise<unknown>) => fn(txMock),
      );

      const result = await service.create(TENANT_ID, USER_ID, baseDto);

      const createCall = txMock.order.create.mock.calls[0][0] as { data: Record<string, unknown> };
      expect(createCall.data['orderNumber']).toBe(`ORD-${YEAR}-0001`);
      expect(result.order_number).toBe(`ORD-${YEAR}-0001`);
      expect(publisher.publish).toHaveBeenCalledWith('order.created', expect.any(Object));
    });

    it('increments sequence from last order number', async () => {
      prisma.workflowDefinition.findFirst.mockResolvedValue({
        states: [{ id: STATE_ID, isInitial: true }],
      });
      prisma.product.findMany.mockResolvedValue([mockProduct]);

      const txOrder = { ...mockOrder, orderNumber: `ORD-${YEAR}-0042` };
      const txMock = {
        order: {
          findFirst: jest.fn().mockResolvedValue({ orderNumber: `ORD-${YEAR}-0041` }),
          create: jest.fn().mockResolvedValue(txOrder),
        },
      };
      prisma.$transaction.mockImplementationOnce(
        (fn: (tx: unknown) => Promise<unknown>) => fn(txMock),
      );

      await service.create(TENANT_ID, USER_ID, baseDto);

      const createCall = txMock.order.create.mock.calls[0][0] as { data: Record<string, unknown> };
      expect(createCall.data['orderNumber']).toBe(`ORD-${YEAR}-0042`);
    });

    it('calculates correct unitPrice and lineTotal with option deltas', async () => {
      prisma.workflowDefinition.findFirst.mockResolvedValue({
        states: [{ id: STATE_ID, isInitial: true }],
      });
      prisma.product.findMany.mockResolvedValue([{ ...mockProduct, basePrice: '1000' }]);

      const dtoWithOptions = {
        type: 'dine_in' as const,
        items: [{
          product_id: PRODUCT_ID,
          quantity: 2,
          options: [{ group_id: 'group-1', group_name: 'Extras', option_id: 'opt-1', option_name: 'Extra sauce', price_delta: 500 }],
        }],
      };

      const txOrder = { ...mockOrder, total: '3000' };
      const txMock = {
        order: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue(txOrder),
        },
      };
      prisma.$transaction.mockImplementationOnce(
        (fn: (tx: unknown) => Promise<unknown>) => fn(txMock),
      );

      await service.create(TENANT_ID, USER_ID, dtoWithOptions);

      const createCall = txMock.order.create.mock.calls[0][0] as { data: { items: { create: { unitPrice: string; lineTotal: string }[] }; subtotal: string } };
      const item = createCall.data.items.create[0];
      expect(parseFloat(item.unitPrice)).toBeCloseTo(1500);   // 1000 + 500
      expect(parseFloat(item.lineTotal)).toBeCloseTo(3000);   // 1500 * 2
      expect(parseFloat(createCall.data.subtotal)).toBeCloseTo(3000);
    });

    it('sets agentId from userId', async () => {
      prisma.workflowDefinition.findFirst.mockResolvedValue({
        states: [{ id: STATE_ID, isInitial: true }],
      });
      prisma.product.findMany.mockResolvedValue([mockProduct]);

      const txMock = {
        order: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue(mockOrder),
        },
      };
      prisma.$transaction.mockImplementationOnce(
        (fn: (tx: unknown) => Promise<unknown>) => fn(txMock),
      );

      await service.create(TENANT_ID, USER_ID, baseDto);

      const createCall = txMock.order.create.mock.calls[0][0] as { data: Record<string, unknown> };
      expect(createCall.data['agentId']).toBe(USER_ID);
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns mapped order when found', async () => {
      prisma.order.findFirst.mockResolvedValue({ ...mockOrder, items: [], payments: [] });

      const result = await service.findOne(TENANT_ID, ORDER_ID);

      expect(result.id).toBe(ORDER_ID);
      expect(result.order_number).toBe(mockOrder.orderNumber);
      expect(result.items).toEqual([]);
    });

    it('throws NotFoundException when order not found', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(service.findOne(TENANT_ID, ORDER_ID)).rejects.toThrow(NotFoundException);
    });

    it('enforces tenant isolation: cannot find order from another tenant', async () => {
      // Simulate RLS: findFirst with where: { id, tenantId } returns null for wrong tenant
      prisma.order.findFirst.mockImplementation(({ where }: { where: Record<string, unknown> }) => {
        if (where['tenantId'] !== TENANT_ID) return Promise.resolve(null);
        return Promise.resolve(mockOrder);
      });

      // tenant B tries to access tenant A's order
      await expect(service.findOne('tenant-B', ORDER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ── transition ──────────────────────────────────────────────────────────────

  describe('transition', () => {
    const TRANSITION_ID = 'tr-1';
    const NEW_STATE = { id: 'state-2', name: 'Confirmée', color: '#00FF00', slug: 'confirmed' };

    it('delegates to workflowEngine and returns new state', async () => {
      prisma.order.findFirst.mockResolvedValue(mockOrder);
      engine.executeTransition.mockResolvedValue({
        orderId: ORDER_ID,
        newStateId: NEW_STATE.id,
        newStateName: NEW_STATE.name,
      });
      prisma.workflowState.findUnique.mockResolvedValue(NEW_STATE);

      const result = await service.transition(TENANT_ID, ORDER_ID, TRANSITION_ID, USER_ID);

      expect(engine.executeTransition).toHaveBeenCalledWith(ORDER_ID, TRANSITION_ID, USER_ID, TENANT_ID);
      expect(result.workflowState).toMatchObject({ id: NEW_STATE.id, name: NEW_STATE.name });
      expect(publisher.publish).toHaveBeenCalledWith('order.state_changed', expect.any(Object));
    });

    it('throws NotFoundException when order does not belong to tenant', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(
        service.transition(TENANT_ID, ORDER_ID, TRANSITION_ID, USER_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── cancel ──────────────────────────────────────────────────────────────────

  describe('cancel', () => {
    it('cancels order, sets cancel state, and publishes event', async () => {
      prisma.order.findFirst.mockResolvedValue(mockOrder);
      prisma.workflowState.findFirst.mockResolvedValue({ id: 'cancel-state' });
      prisma.order.update.mockResolvedValue({ ...mockOrder, status: 'cancelled' });

      const result = await service.cancel(TENANT_ID, ORDER_ID, USER_ID);

      expect(result.cancelled).toBe(true);
      expect(result.workflowStateId).toBe('cancel-state');
      expect(publisher.publish).toHaveBeenCalledWith('order.state_changed', expect.any(Object));
    });

    it('cancels even when no cancel workflow state exists', async () => {
      prisma.order.findFirst.mockResolvedValue(mockOrder);
      prisma.workflowState.findFirst.mockResolvedValue(null);
      prisma.order.update.mockResolvedValue({ ...mockOrder, status: 'cancelled' });

      const result = await service.cancel(TENANT_ID, ORDER_ID, USER_ID);

      expect(result.cancelled).toBe(true);
      expect(result.workflowStateId).toBeNull();
    });

    it('throws NotFoundException when order not found', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(service.cancel(TENANT_ID, ORDER_ID, USER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ── getAvailableTransitions ──────────────────────────────────────────────────

  describe('getAvailableTransitions', () => {
    it('delegates to workflowEngine.getAvailableTransitions', async () => {
      prisma.order.findFirst.mockResolvedValue(mockOrder);
      engine.getAvailableTransitions.mockResolvedValue([{ id: 'tr-1', name: 'Confirmer' }]);

      const result = await service.getAvailableTransitions(TENANT_ID, ORDER_ID, USER_ID);

      expect(engine.getAvailableTransitions).toHaveBeenCalledWith(ORDER_ID, USER_ID, TENANT_ID);
      expect(result).toHaveLength(1);
    });
  });

  // ── findAll ──────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns paginated orders with metadata', async () => {
      const orders = [{ ...mockOrder, items: [], payments: [] }];
      prisma.order.findMany.mockResolvedValue(orders);
      prisma.order.count.mockResolvedValue(1);

      const result = await service.findAll(TENANT_ID, { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('always filters by tenantId', async () => {
      prisma.order.findMany.mockResolvedValue([]);
      prisma.order.count.mockResolvedValue(0);

      await service.findAll(TENANT_ID, {});

      const findCall = prisma.order.findMany.mock.calls[0][0] as { where: Record<string, unknown> };
      expect(findCall.where['tenantId']).toBe(TENANT_ID);
    });
  });

  // ── update ───────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates notes and returns mapped order', async () => {
      prisma.order.findFirst.mockResolvedValue(mockOrder);
      prisma.order.update.mockResolvedValue({ ...mockOrder, notes: 'Sans piment' });

      const result = await service.update(TENANT_ID, ORDER_ID, { notes: 'Sans piment' });

      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: ORDER_ID }, data: expect.objectContaining({ notes: 'Sans piment' }) }),
      );
      expect(result.id).toBe(ORDER_ID);
    });

    it('throws NotFoundException when order not found', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(service.update(TENANT_ID, ORDER_ID, { notes: 'test' })).rejects.toThrow(NotFoundException);
    });
  });

  // ── addItem ──────────────────────────────────────────────────────────────────

  describe('addItem', () => {
    const makeTxMock = () => ({
      orderItem: {
        create: jest.fn().mockResolvedValue({ id: 'item-1', unitPrice: '1000', lineTotal: '2000' }),
        findMany: jest.fn().mockResolvedValue([{ lineTotal: '2000' }]),
      },
      order: { update: jest.fn().mockResolvedValue({}) },
    });

    it('throws NotFoundException when product not found', async () => {
      prisma.order.findFirst.mockResolvedValue(mockOrder);
      prisma.product.findFirst.mockResolvedValue(null);

      await expect(
        service.addItem(TENANT_ID, ORDER_ID, { product_id: PRODUCT_ID, quantity: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when product unavailable', async () => {
      prisma.order.findFirst.mockResolvedValue(mockOrder);
      prisma.product.findFirst.mockResolvedValue({ ...mockProduct, isAvailable: false });

      await expect(
        service.addItem(TENANT_ID, ORDER_ID, { product_id: PRODUCT_ID, quantity: 1 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('computes unitPrice as base + option delta, lineTotal as unitPrice * qty', async () => {
      prisma.order.findFirst.mockResolvedValue(mockOrder);
      prisma.product.findFirst.mockResolvedValue({ ...mockProduct, basePrice: '1000' });

      const txMock = makeTxMock();
      prisma.$transaction.mockImplementationOnce(
        (fn: (tx: unknown) => Promise<unknown>) => fn(txMock),
      );

      await service.addItem(TENANT_ID, ORDER_ID, {
        product_id: PRODUCT_ID,
        quantity: 2,
        options: [{ group_id: 'g1', group_name: 'Sauce', option_id: 'o1', option_name: 'Piquant', price_delta: 200 }],
      });

      const createCall = txMock.orderItem.create.mock.calls[0][0] as {
        data: { unitPrice: string; lineTotal: string };
      };
      expect(parseFloat(createCall.data.unitPrice)).toBeCloseTo(1200); // 1000+200
      expect(parseFloat(createCall.data.lineTotal)).toBeCloseTo(2400); // 1200*2
    });
  });

  // ── updateItem ───────────────────────────────────────────────────────────────

  describe('updateItem', () => {
    it('throws NotFoundException when item not found', async () => {
      prisma.order.findFirst.mockResolvedValue(mockOrder);
      prisma.orderItem.findFirst.mockResolvedValue(null);

      await expect(
        service.updateItem(TENANT_ID, ORDER_ID, 'item-1', { quantity: 3 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates quantity and recalculates lineTotal', async () => {
      prisma.order.findFirst.mockResolvedValue(mockOrder);
      prisma.orderItem.findFirst.mockResolvedValue({ id: 'item-1', orderId: ORDER_ID, tenantId: TENANT_ID, unitPrice: '1000', quantity: 1 });

      const txMock = {
        orderItem: {
          update: jest.fn().mockResolvedValue({ id: 'item-1' }),
          findMany: jest.fn().mockResolvedValue([{ lineTotal: '3000' }]),
        },
        order: { update: jest.fn().mockResolvedValue({}) },
      };
      prisma.$transaction.mockImplementationOnce(
        (fn: (tx: unknown) => Promise<unknown>) => fn(txMock),
      );

      await service.updateItem(TENANT_ID, ORDER_ID, 'item-1', { quantity: 3 });

      const updateCall = txMock.orderItem.update.mock.calls[0][0] as {
        data: { quantity: number; lineTotal: string };
      };
      expect(updateCall.data.quantity).toBe(3);
      expect(parseFloat(updateCall.data.lineTotal)).toBeCloseTo(3000); // 1000*3
    });
  });

  // ── removeItem ───────────────────────────────────────────────────────────────

  describe('removeItem', () => {
    it('throws NotFoundException when item not found', async () => {
      prisma.order.findFirst.mockResolvedValue(mockOrder);
      prisma.orderItem.findFirst.mockResolvedValue(null);

      await expect(
        service.removeItem(TENANT_ID, ORDER_ID, 'item-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('deletes item and returns { deleted: true }', async () => {
      prisma.order.findFirst.mockResolvedValue(mockOrder);
      prisma.orderItem.findFirst.mockResolvedValue({ id: 'item-1', orderId: ORDER_ID, tenantId: TENANT_ID });

      const txMock = {
        orderItem: {
          delete: jest.fn().mockResolvedValue({}),
          findMany: jest.fn().mockResolvedValue([]),
        },
        order: { update: jest.fn().mockResolvedValue({}) },
      };
      prisma.$transaction.mockImplementationOnce(
        (fn: (tx: unknown) => Promise<unknown>) => fn(txMock),
      );

      const result = await service.removeItem(TENANT_ID, ORDER_ID, 'item-1');

      expect(txMock.orderItem.delete).toHaveBeenCalledWith({ where: { id: 'item-1' } });
      expect(result).toEqual({ deleted: true });
    });
  });
});
