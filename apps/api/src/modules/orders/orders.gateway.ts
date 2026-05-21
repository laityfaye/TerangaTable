import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

interface JoinTenantPayload {
  tenantId: string;
  token: string;
}

interface WorkflowStateSnap {
  id: string;
  name: string;
  color: string;
  slug: string;
}

interface OrderStateChangedPayload {
  orderId: string;
  workflowState: WorkflowStateSnap | null;
  updatedAt: string;
}

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  transports: ['websocket', 'polling'],
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server!: Server;

  private readonly logger = new Logger(OrdersGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket) {
    this.logger.debug(`WS connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`WS disconnected: ${client.id}`);
  }

  @SubscribeMessage('join:tenant')
  async handleJoinTenant(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinTenantPayload,
  ) {
    try {
      const payload = this.jwtService.verify<{ sub: string; tenantId: string }>(data.token);

      if (!payload.tenantId || payload.tenantId !== data.tenantId) {
        client.emit('error', { message: 'Accès non autorisé à ce tenant' });
        return;
      }

      await client.join(`tenant:${data.tenantId}`);
      client.emit('joined:tenant', { tenantId: data.tenantId });
      this.logger.debug(`${client.id} joined tenant:${data.tenantId}`);
    } catch {
      client.emit('error', { message: 'Token invalide' });
    }
  }

  @SubscribeMessage('leave:tenant')
  async handleLeaveTenant(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tenantId: string },
  ) {
    await client.leave(`tenant:${data.tenantId}`);
    client.emit('left:tenant', { tenantId: data.tenantId });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emitOrderCreated(tenantId: string, order: any) {
    this.server.to(`tenant:${tenantId}`).emit('order:created', order);
  }

  emitOrderStateChanged(tenantId: string, payload: OrderStateChangedPayload) {
    this.server.to(`tenant:${tenantId}`).emit('order:state_changed', payload);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emitOrderUpdated(tenantId: string, order: any) {
    this.server.to(`tenant:${tenantId}`).emit('order:updated', order);
  }
}
