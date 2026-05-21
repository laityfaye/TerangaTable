import { Module } from '@nestjs/common';
import { ZonesController } from './zones.controller';
import { DriversController } from './drivers.controller';
import { DeliveryController } from './delivery.controller';
import { WebhookController } from './webhook.controller';
import { ZonesService } from './zones.service';
import { DriversService } from './drivers.service';
import { DeliveryService } from './delivery.service';
import { WebhookService } from './webhook.service';

@Module({
  controllers: [ZonesController, DriversController, DeliveryController, WebhookController],
  providers: [ZonesService, DriversService, DeliveryService, WebhookService],
  exports: [DeliveryService, ZonesService, DriversService],
})
export class DeliveryModule {}
