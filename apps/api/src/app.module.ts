import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { TenantResolutionMiddleware } from './common/middleware/tenant-resolution.middleware';
import { TenantContextInterceptor } from './common/interceptors/tenant-context.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RedisCacheModule } from './common/redis-cache.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { RegionsModule } from './modules/regions/regions.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { MenuModule } from './modules/menu/menu.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { PosModule } from './modules/pos/pos.module';
import { CrmModule } from './modules/crm/crm.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { WebsiteModule } from './modules/website/website.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';
import { RulesEngineModule } from './modules/rules-engine/rules-engine.module';
import { CustomFieldsModule } from './modules/custom-fields/custom-fields.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SettingsModule } from './modules/settings/settings.module';
import { StorageModule } from './modules/storage/storage.module';
import { MailModule } from './common/mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting global: 100 req/min par IP
    // Les routes auth surclassent avec @Throttle()
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 100 },
    ]),

    PrismaModule,
    RedisCacheModule,
    HealthModule,
    AuthModule,
    TenantsModule,
    RegionsModule,
    UsersModule,
    RolesModule,
    MenuModule,
    OrdersModule,
    PaymentsModule,
    ReservationsModule,
    PosModule,
    CrmModule,
    DeliveryModule,
    WebsiteModule,
    AnalyticsModule,
    WorkflowsModule,
    RulesEngineModule,
    CustomFieldsModule,
    NotificationsModule,
    SettingsModule,
    StorageModule,
    MailModule,
  ],
  providers: [
    // Rate limiting guard global
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Tenant context injection (RLS)
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
    // Request logging (request_id, tenant_id, slow queries)
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantResolutionMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
