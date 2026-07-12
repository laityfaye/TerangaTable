import { Module } from '@nestjs/common';
import { MarketplaceModule } from '../marketplace/marketplace.module';
import { WebsiteModule } from '../website/website.module';
import { CrmModule } from '../crm/crm.module';
import { OrdersModule } from '../orders/orders.module';
import { OrderPublisher } from '../../events/publishers/order.publisher';
import { WhatsappWebhookController } from './whatsapp-webhook.controller';
import { WhatsappMediaController } from './whatsapp-media.controller';
import { WhatsappService } from './whatsapp.service';
import { WhatsappOrdersService } from './whatsapp-orders.service';
import { MenuContextService } from './services/menu-context.service';
import { TwilioClientService } from './services/twilio-client.service';
import { VoiceTranscriptionService } from './services/voice-transcription.service';
import { TwilioSignatureGuard } from './guards/twilio-signature.guard';

@Module({
  imports: [MarketplaceModule, WebsiteModule, CrmModule, OrdersModule],
  controllers: [WhatsappWebhookController, WhatsappMediaController],
  providers: [
    WhatsappService,
    WhatsappOrdersService,
    MenuContextService,
    TwilioClientService,
    VoiceTranscriptionService,
    TwilioSignatureGuard,
    // OrderPublisher n'est pas exporté par OrdersModule (juste un wrapper
    // EventEmitter2, lui-même global) — on le redéclare ici plutôt que d'y toucher.
    OrderPublisher,
  ],
})
export class WhatsappModule {}
