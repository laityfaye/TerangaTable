import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ReservationPublisher {
  private readonly logger = new Logger(ReservationPublisher.name);

  async publish(event: string, payload: unknown) {
    this.logger.log(`Publishing event: ${event}`);
    // RabbitMQ integration à brancher via @nestjs/microservices
    void payload;
  }
}
