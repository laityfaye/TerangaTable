import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Twilio from 'twilio';

@Injectable()
export class TwilioClientService {
  private readonly logger = new Logger(TwilioClientService.name);
  private readonly client: ReturnType<typeof Twilio> | null;
  private readonly fromNumber: string | undefined;

  constructor(private readonly config: ConfigService) {
    const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.config.get<string>('TWILIO_AUTH_TOKEN');
    this.fromNumber = this.config.get<string>('TWILIO_WHATSAPP_NUMBER');
    this.client = accountSid && authToken ? Twilio(accountSid, authToken) : null;
  }

  /**
   * `to` est un numéro E.164 sans préfixe (ex: "+221771234567") — le préfixe whatsapp: est ajouté ici.
   * `mediaUrls` doit pointer vers des URLs publiquement accessibles (Twilio les récupère
   * lui-même) — inutilisable avec des URLs localhost/tunnel privé.
   */
  async sendMessage(to: string, body: string, mediaUrls?: string[]): Promise<void> {
    if (!this.client || !this.fromNumber) {
      this.logger.warn('Twilio non configuré — message non envoyé');
      return;
    }
    try {
      await this.client.messages.create({
        from: `whatsapp:${this.fromNumber}`,
        to: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`,
        body,
        ...(mediaUrls && mediaUrls.length > 0 ? { mediaUrl: mediaUrls } : {}),
      });
    } catch (err) {
      this.logger.error(`Échec envoi WhatsApp vers ${to}: ${(err as Error).message}`);
    }
  }
}
