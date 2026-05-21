import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PaymentPublisher {
  private readonly logger = new Logger(PaymentPublisher.name);

  async publish(event: string, payload: unknown) {
    this.logger.log(`Publishing event: ${event}`);
    // RabbitMQ integration à brancher via @nestjs/microservices
    void payload;
  }
}
