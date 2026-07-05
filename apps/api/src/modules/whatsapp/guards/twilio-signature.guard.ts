import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Twilio from 'twilio';
import type { Request } from 'express';

/**
 * Vérifie que la requête POST provient bien de Twilio (X-Twilio-Signature),
 * contrairement au webhook delivery/glovo-ubereats existant qui n'a aucune
 * vérification. TWILIO_WEBHOOK_URL doit être l'URL publique exacte configurée
 * côté Twilio (pas dérivée de req.protocol/host — non fiable derrière ngrok
 * ou un proxy).
 */
@Injectable()
export class TwilioSignatureGuard implements CanActivate {
  private readonly logger = new Logger(TwilioSignatureGuard.name);

  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    if (this.config.get<string>('TWILIO_SKIP_SIGNATURE_CHECK') === 'true') {
      this.logger.warn('TWILIO_SKIP_SIGNATURE_CHECK=true — signature Twilio ignorée (dev only)');
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const signature = request.headers['x-twilio-signature'] as string | undefined;
    const authToken = this.config.get<string>('TWILIO_AUTH_TOKEN');
    const webhookUrl = this.config.get<string>('TWILIO_WEBHOOK_URL');

    if (!authToken || !webhookUrl) {
      this.logger.error('TWILIO_AUTH_TOKEN ou TWILIO_WEBHOOK_URL absent — requête rejetée');
      throw new ForbiddenException('Configuration Twilio manquante');
    }
    if (!signature) {
      throw new ForbiddenException('Signature Twilio absente');
    }

    const valid = Twilio.validateRequest(
      authToken,
      signature,
      webhookUrl,
      request.body as Record<string, string>,
    );

    if (!valid) {
      this.logger.warn('Signature Twilio invalide — requête rejetée');
      throw new ForbiddenException('Signature Twilio invalide');
    }

    return true;
  }
}
