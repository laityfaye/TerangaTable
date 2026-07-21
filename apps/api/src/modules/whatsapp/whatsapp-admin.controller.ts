import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequireModule } from '../../common/decorators/require-permission.decorator';
import { PrismaService } from '../../prisma/prisma.service';

interface TenantCtx { id: string }

/**
 * Endpoint dashboard restaurateur pour le module whatsapp — distinct du webhook
 * public (`whatsapp-webhook.controller.ts`, non gaté, appelé par Twilio). Le
 * numéro étant partagé plateforme (pas un compte Twilio par tenant), il n'y a
 * rien à "configurer" ici : juste un statut + des stats scoping tenant.
 */
@ApiTags('WhatsApp Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, ModuleGuard)
@RequireModule('whatsapp')
@Controller('whatsapp/admin')
export class WhatsappAdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Statut et statistiques de l\'assistant WhatsApp pour ce tenant' })
  async getStatus(@CurrentTenant() tenant: TenantCtx) {
    const [conversationsCount, ordersCount] = await Promise.all([
      this.prisma.whatsappConversation.count({ where: { tenantId: tenant.id } }),
      this.prisma.whatsappConversation.count({ where: { tenantId: tenant.id, stage: 'completed' } }),
    ]);

    const rawNumber = this.config.get<string>('TWILIO_WHATSAPP_NUMBER');

    return {
      data: {
        active: true,
        shared_number: rawNumber ? rawNumber.replace(/^whatsapp:/, '') : null,
        conversations_count: conversationsCount,
        completed_orders_count: ordersCount,
      },
    };
  }
}
