import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';

export interface CreateNotificationDto {
  userId?: string | null;
  type: string;
  title: string;
  body?: string | null;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async create(tenantId: string, dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        tenantId,
        userId: dto.userId ?? null,
        type: dto.type,
        title: dto.title,
        body: dto.body ?? null,
        metadata: (dto.metadata ?? {}) as unknown as Prisma.InputJsonValue,
      },
    });

    this.gateway.emitNotification(tenantId, this.mapNotification(notification));
    return this.mapNotification(notification);
  }

  async findAll(tenantId: string, userId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: {
        tenantId,
        OR: [{ userId }, { userId: null }],
      },
      orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
      take: 50,
    });

    const mapped = notifications.map((n) => this.mapNotification(n));
    return {
      data: mapped,
      unread_count: mapped.filter((n) => !n.is_read).length,
    };
  }

  async markRead(tenantId: string, userId: string, id: string) {
    await this.prisma.notification.updateMany({
      where: { id, tenantId, OR: [{ userId }, { userId: null }] },
      data: { isRead: true },
    });
    return { success: true };
  }

  async markAllRead(tenantId: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { tenantId, OR: [{ userId }, { userId: null }], isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapNotification(n: any) {
    return {
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body ?? null,
      is_read: n.isRead,
      metadata: n.metadata ?? {},
      created_at: n.createdAt,
    };
  }
}
