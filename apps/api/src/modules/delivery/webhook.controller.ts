import {
  Controller,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebhookService } from './webhook.service';

@ApiTags('Delivery - Webhooks')
@Controller('delivery/webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('glovo/:tenantId')
  @ApiOperation({ summary: 'Réception commande Glovo (pas d\'auth — IP whitelist recommandée)' })
  @HttpCode(HttpStatus.OK)
  handleGlovo(
    @Param('tenantId') tenantId: string,
    @Body() payload: Record<string, unknown>,
  ) {
    return this.webhookService.handleGlovo(tenantId, payload);
  }

  @Post('ubereats/:tenantId')
  @ApiOperation({ summary: 'Réception commande Uber Eats (pas d\'auth — IP whitelist recommandée)' })
  @HttpCode(HttpStatus.OK)
  handleUberEats(
    @Param('tenantId') tenantId: string,
    @Body() payload: Record<string, unknown>,
  ) {
    return this.webhookService.handleUberEats(tenantId, payload);
  }
}
