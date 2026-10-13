import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ZonesController } from './zones.controller';
import { DriversController } from './drivers.controller';
import { DeliveryController } from './delivery.controller';
import { WebhookController } from './webhook.controller';
import { DeliveryOffersPublicController } from './delivery-offers-public.controller';
import { ZonesService } from './zones.service';
import { DriversService } from './drivers.service';
import { DeliveryService } from './delivery.service';
import { WebhookService } from './webhook.service';
import { DeliveryDispatchService } from './delivery-dispatch.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    ZonesController,
    DriversController,
    DeliveryController,
    WebhookController,
    DeliveryOffersPublicController,
  ],
  providers: [ZonesService, DriversService, DeliveryService, WebhookService, DeliveryDispatchService],
  exports: [DeliveryService, ZonesService, DriversService, DeliveryDispatchService],
})
export class DeliveryModule {}
