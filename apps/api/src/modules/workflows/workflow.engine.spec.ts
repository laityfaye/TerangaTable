import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { WorkflowEngine } from './workflow.engine';
import { PrismaService } from '../../prisma/prisma.service';

const TENANT_ID     = 'tenant-1';
const ORDER_ID      = 'order-1';
const USER_ID       = 'user-1';
const STATE_A       = 'state-a';
const STATE_B       = 'state-b';
const TRANSITION_ID = 'tr-1';

const makePrisma = () => ({
  order: { findFirst: jest.fn(), update: jest.fn() },
  userRole: { findMany: jest.fn() },
  workflowTransition: { findMany: jest.fn(), findFirst: jest.fn() },
});

describe('WorkflowEngine', () => {
  let engine: WorkflowEngine;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(async () => {
    prisma = makePrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowEngine,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    engine = module.get<WorkflowEngine>(WorkflowEngine);
  });

  // ── getAvailableTransitions ─────────────────────────────────────────────────

  describe('getAvailableTransitions', () => {
    it('throws NotFoundException when order not found', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(
        engine.getAvailableTransitions(ORDER_ID, USER_ID, TENANT_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns all transitions when allowedRoles is empty (open to all)', async () => {
      prisma.order.findFirst.mockResolvedValue({ workflowStateId: STATE_A });
      prisma.userRole.findMany.mockResolvedValue([]);
      prisma.workflowTransition.findMany.mockResolvedValue([
        {
          id: TRANSITION_ID,
          name: 'Confirmer',
          allowedRoles: [],
          toState: { id: STATE_B, name: 'Confirmée', color: '#00F' },
        },
      ]);

      const result = await engine.getAvailableTransitions(ORDER_ID, USER_ID, TENANT_ID);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(TRANSITION_ID);
      expect(result[0].toState.id).toBe(STATE_B);
    });

    it('filters out transitions when user has none of the required roles', async () => {
      prisma.order.findFirst.mockResolvedValue({ workflowStateId: STATE_A });
      prisma.userRole.findMany.mockResolvedValue([
        { role: { slug: 'server' } },
      ]);
      prisma.workflowTransition.findMany.mockResolvedValue([
        {
          id: TRANSITION_ID,
          name: 'Valider paiement',
          allowedRoles: ['cashier', 'manager'],
          toState: { id: STATE_B, name: 'Payée', color: '#0F0' },
        },
      ]);

      const result = await engine.getAvailableTransitions(ORDER_ID, USER_ID, TENANT_ID);

      expect(result).toHaveLength(0);
    });

    it('includes transition when user has one of multiple allowed roles', async () => {
      prisma.order.findFirst.mockResolvedValue({ workflowStateId: STATE_A });
      prisma.userRole.findMany.mockResolvedValue([
        { role: { slug: 'manager' } },
      ]);
      prisma.workflowTransition.findMany.mockResolvedValue([
        {
          id: TRANSITION_ID,
          name: 'Fermer',
          allowedRoles: ['cashier', 'manager'],
          toState: { id: STATE_B, name: 'Fermée', color: '#F00' },
        },
      ]);

      const result = await engine.getAvailableTransitions(ORDER_ID, USER_ID, TENANT_ID);

      expect(result).toHaveLength(1);
    });

    it('returns multiple transitions correctly filtered by role', async () => {
      prisma.order.findFirst.mockResolvedValue({ workflowStateId: STATE_A });
      prisma.userRole.findMany.mockResolvedValue([
        { role: { slug: 'server' } },
      ]);
      prisma.workflowTransition.findMany.mockResolvedValue([
        {
          id: 'tr-open',
          name: 'Prendre en charge',
          allowedRoles: [],
          toState: { id: 'state-wip', name: 'En préparation', color: '#FF0' },
        },
        {
          id: 'tr-restricted',
          name: 'Rembourser',
          allowedRoles: ['manager', 'owner'],
          toState: { id: 'state-refund', name: 'Remboursée', color: '#F00' },
        },
      ]);

      const result = await engine.getAvailableTransitions(ORDER_ID, USER_ID, TENANT_ID);

      // Only the open transition should be returned
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tr-open');
    });

    it('maps result to correct shape (id, name, toState)', async () => {
      prisma.order.findFirst.mockResolvedValue({ workflowStateId: STATE_A });
      prisma.userRole.findMany.mockResolvedValue([]);
      prisma.workflowTransition.findMany.mockResolvedValue([
        {
          id: TRANSITION_ID,
          name: 'Confirmer',
          allowedRoles: [],
          toState: { id: STATE_B, name: 'Confirmée', color: '#00F' },
        },
      ]);

      const [tr] = await engine.getAvailableTransitions(ORDER_ID, USER_ID, TENANT_ID);

      expect(tr).toEqual({
        id: TRANSITION_ID,
        name: 'Confirmer',
        toState: { id: STATE_B, name: 'Confirmée', color: '#00F' },
      });
    });
  });

  // ── executeTransition ───────────────────────────────────────────────────────

  describe('executeTransition', () => {
    it('throws NotFoundException when order not found', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(
        engine.executeTransition(ORDER_ID, TRANSITION_ID, USER_ID, TENANT_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when transition is not available from current state', async () => {
      prisma.order.findFirst.mockResolvedValue({ id: ORDER_ID, workflowStateId: STATE_A });
      prisma.workflowTransition.findFirst.mockResolvedValue(null);

      await expect(
        engine.executeTransition(ORDER_ID, TRANSITION_ID, USER_ID, TENANT_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException when user lacks required role', async () => {
      prisma.order.findFirst.mockResolvedValue({ id: ORDER_ID, workflowStateId: STATE_A });
      prisma.workflowTransition.findFirst.mockResolvedValue({
        id: TRANSITION_ID,
        toStateId: STATE_B,
        allowedRoles: ['manager'],
        toState: { id: STATE_B, name: 'Confirmée', triggersAlert: false },
      });
      prisma.userRole.findMany.mockResolvedValue([{ role: { slug: 'server' } }]);

      await expect(
        engine.executeTransition(ORDER_ID, TRANSITION_ID, USER_ID, TENANT_ID),
      ).rejects.toThrow(ForbiddenException);
    });

    it('executes transition and updates order state', async () => {
      prisma.order.findFirst.mockResolvedValue({ id: ORDER_ID, workflowStateId: STATE_A });
      prisma.workflowTransition.findFirst.mockResolvedValue({
        id: TRANSITION_ID,
        toStateId: STATE_B,
        allowedRoles: [],
        toState: { id: STATE_B, name: 'En préparation', triggersAlert: false },
      });
      prisma.order.update.mockResolvedValue({});

      const result = await engine.executeTransition(ORDER_ID, TRANSITION_ID, USER_ID, TENANT_ID);

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: ORDER_ID },
        data: { workflowStateId: STATE_B },
      });
      expect(result).toEqual({
        orderId: ORDER_ID,
        newStateId: STATE_B,
        newStateName: 'En préparation',
      });
    });

    it('skips role check when allowedRoles is empty', async () => {
      prisma.order.findFirst.mockResolvedValue({ id: ORDER_ID, workflowStateId: STATE_A });
      prisma.workflowTransition.findFirst.mockResolvedValue({
        id: TRANSITION_ID,
        toStateId: STATE_B,
        allowedRoles: [],
        toState: { id: STATE_B, name: 'Confirmée', triggersAlert: false },
      });
      prisma.order.update.mockResolvedValue({});

      await engine.executeTransition(ORDER_ID, TRANSITION_ID, USER_ID, TENANT_ID);

      expect(prisma.userRole.findMany).not.toHaveBeenCalled();
    });

    it('allows transition when user has one of multiple required roles', async () => {
      prisma.order.findFirst.mockResolvedValue({ id: ORDER_ID, workflowStateId: STATE_A });
      prisma.workflowTransition.findFirst.mockResolvedValue({
        id: TRANSITION_ID,
        toStateId: STATE_B,
        allowedRoles: ['owner', 'manager'],
        toState: { id: STATE_B, name: 'Annulée', triggersAlert: false },
      });
      prisma.userRole.findMany.mockResolvedValue([
        { role: { slug: 'manager' } },
      ]);
      prisma.order.update.mockResolvedValue({});

      const result = await engine.executeTransition(ORDER_ID, TRANSITION_ID, USER_ID, TENANT_ID);

      expect(result.newStateId).toBe(STATE_B);
    });
  });
});
