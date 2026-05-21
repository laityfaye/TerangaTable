import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ZonesController } from './zones.controller';
import { TablesController } from './tables.controller';
import { ReservationsController } from './reservations.controller';
import { TablesService } from './tables.service';
import { ReservationsService } from './reservations.service';
import { ReservationsGateway } from './reservations.gateway';
import { ReservationPublisher } from '../../events/publishers/reservation.publisher';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ZonesController, TablesController, ReservationsController],
  providers: [TablesService, ReservationsService, ReservationsGateway, ReservationPublisher],
  exports: [ReservationsService, TablesService],
})
export class ReservationsModule {}
