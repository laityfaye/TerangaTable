import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { RedisCacheService } from '../../common/services/redis-cache.service';
import { WhatsappService } from './whatsapp.service';
import { TwilioSignatureGuard } from './guards/twilio-signature.guard';
import { WHATSAPP_MSG_DEDUPE_PREFIX, WHATSAPP_MSG_DEDUPE_TTL } from './whatsapp.constants';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsappWebhookController {
  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly redis: RedisCacheService,
  ) {}

  /**
   * Numéro WhatsApp partagé pour toute la plateforme — le restaurant est
   * identifié en conversation, pas dans l'URL (contrairement à
   * delivery/webhook/:tenantId). Signature vérifiée par TwilioSignatureGuard ;
   * idempotence par MessageSid (Twilio peut re-livrer un même message).
   */
  @Post('webhook')
  @UseGuards(TwilioSignatureGuard)
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Réception des messages WhatsApp entrants (Twilio)' })
  async handleWebhook(@Body() body: Record<string, string>): Promise<void> {
    const from = body['From'];
    const messageSid = body['MessageSid'];
    const text = body['Body'] ?? '';

    if (!from || !messageSid) return;

    const dedupeKey = `${WHATSAPP_MSG_DEDUPE_PREFIX}${messageSid}`;
    const acquired = await this.redis.client
      .set(dedupeKey, '1', 'EX', WHATSAPP_MSG_DEDUPE_TTL, 'NX')
      .catch(() => 'OK'); // si Redis est indisponible, on traite quand même (mieux qu'un silence total)

    if (!acquired) return; // livraison dupliquée — déjà traitée

    await this.whatsappService.handleInboundMessage(from, text, messageSid);
  }
}
