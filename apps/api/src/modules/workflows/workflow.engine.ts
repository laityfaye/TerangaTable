import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AvailableTransition {
  id: string;
  name: string;
  toState: { id: string; name: string; color: string };
}

@Injectable()
export class WorkflowEngine {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailableTransitions(
    orderId: string,
    userId: string,
    tenantId: string,
  ): Promise<AvailableTransition[]> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
      select: { workflowStateId: true },
    });
    if (!order) throw new NotFoundException('Commande introuvable');

    const userRoles = await this.prisma.userRole.findMany({
      where: { userId, tenantId },
      include: { role: { select: { slug: true } } },
    });
    const roleSlugs = userRoles.map((ur) => ur.role.slug);

    const transitions = await this.prisma.workflowTransition.findMany({
      where: {
        OR: [
          { fromStateId: order.workflowStateId },
          { fromStateId: null },
        ],
        toState: { tenantId },
      },
      include: {
        toState: { select: { id: true, name: true, color: true } },
      },
    });

    return transitions
      .filter((t) => {
        if (t.allowedRoles.length === 0) return true;
        return t.allowedRoles.some((r) => roleSlugs.includes(r));
      })
      .map((t) => ({
        id: t.id,
        name: t.name,
        toState: t.toState,
      }));
  }

  async executeTransition(
    orderId: string,
    transitionId: string,
    userId: string,
    tenantId: string,
  ): Promise<{ orderId: string; newStateId: string; newStateName: string }> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
      select: { id: true, workflowStateId: true },
    });
    if (!order) throw new NotFoundException('Commande introuvable');

    const transition = await this.prisma.workflowTransition.findFirst({
      where: {
        id: transitionId,
        OR: [
          { fromStateId: order.workflowStateId },
          { fromStateId: null },
        ],
      },
      include: { toState: { select: { id: true, name: true, triggersAlert: true } } },
    });

    if (!transition) {
      throw new BadRequestException('Cette transition n\'est pas disponible depuis l\'état actuel de la commande');
    }

    if (transition.allowedRoles.length > 0) {
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId, tenantId },
        include: { role: { select: { slug: true } } },
      });
      const roleSlugs = userRoles.map((ur) => ur.role.slug);
      const hasRole = transition.allowedRoles.some((r) => roleSlugs.includes(r));
      if (!hasRole) throw new ForbiddenException('Vous n\'avez pas le rôle requis pour cette transition');
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: { workflowStateId: transition.toStateId },
    });

    return {
      orderId,
      newStateId: transition.toStateId,
      newStateName: transition.toState.name,
    };
  }
}
