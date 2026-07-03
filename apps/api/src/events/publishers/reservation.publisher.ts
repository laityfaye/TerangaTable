import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ReservationPublisher {
  private readonly logger = new Logger(ReservationPublisher.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  async publish(event: string, payload: unknown) {
    this.logger.log(`Publishing event: ${event}`);
    this.eventEmitter.emit(event, payload);
  }
}
