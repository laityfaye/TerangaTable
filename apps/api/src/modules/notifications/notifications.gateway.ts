import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  transports: ['websocket', 'polling'],
})
export class NotificationsGateway {
  @WebSocketServer()
  private readonly server!: Server;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emitNotification(tenantId: string, notification: any) {
    this.server.to(`tenant:${tenantId}`).emit('notification:new', notification);
  }
}
