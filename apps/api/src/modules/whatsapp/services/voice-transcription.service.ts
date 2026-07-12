import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const GROQ_TRANSCRIPTION_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const GROQ_WHISPER_MODEL = 'whisper-large-v3-turbo';

@Injectable()
export class VoiceTranscriptionService {
  private readonly logger = new Logger(VoiceTranscriptionService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Télécharge un média vocal WhatsApp (authentifié via Twilio) et le transcrit
   * via l'API Whisper de Groq (gratuite dans la limite du quota, sans abonnement).
   * Retourne null si la config est absente ou en cas d'échec réseau/API —
   * l'appelant doit prévoir un repli vers le message "texte uniquement".
   */
  async transcribeFromTwilioMedia(mediaUrl: string, contentType: string): Promise<string | null> {
    const groqApiKey = this.config.get<string>('GROQ_API_KEY');
    const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.config.get<string>('TWILIO_AUTH_TOKEN');

    if (!groqApiKey || !accountSid || !authToken) {
      this.logger.warn('GROQ_API_KEY ou identifiants Twilio absents — transcription ignorée');
      return null;
    }

    try {
      const audioResponse = await fetch(mediaUrl, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        },
      });
      if (!audioResponse.ok) {
        this.logger.error(`Échec téléchargement média Twilio (${audioResponse.status})`);
        return null;
      }
      const audioBuffer = await audioResponse.arrayBuffer();

      const form = new FormData();
      form.append('file', new Blob([audioBuffer], { type: contentType }), 'voice-message.ogg');
      form.append('model', GROQ_WHISPER_MODEL);

      const transcriptionResponse = await fetch(GROQ_TRANSCRIPTION_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${groqApiKey}` },
        body: form,
      });

      if (!transcriptionResponse.ok) {
        this.logger.error(`Échec transcription Groq (${transcriptionResponse.status})`);
        return null;
      }

      const result = (await transcriptionResponse.json()) as { text?: string };
      return result.text?.trim() || null;
    } catch (err) {
      this.logger.error(`Erreur transcription vocale: ${(err as Error).message}`);
      return null;
    }
  }
}
