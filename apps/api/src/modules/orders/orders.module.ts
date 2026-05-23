import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersGateway } from './orders.gateway';
import { WorkflowsModule } from '../workflows/workflows.module';
import { OrderPublisher } from '../../events/publishers/order.publisher';
import { CustomFieldsModule } from '../custom-fields/custom-fields.module';

@Module({
  imports: [
    WorkflowsModule,
    CustomFieldsModule,
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersGateway, OrderPublisher],
  exports: [OrdersService, OrdersGateway],
})
export class OrdersModule {}
