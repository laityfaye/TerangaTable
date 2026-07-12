import { BadRequestException, Controller, Get, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Response } from 'express';
import sharp from 'sharp';

/**
 * WhatsApp (via Twilio) n'accepte pas le WebP pour les messages image classiques
 * — or tout le pipeline de stockage produit du WebP (voir storage.service.ts).
 * Ce endpoint reconvertit à la volée en JPEG au moment de l'envoi, sans toucher
 * au stockage existant (qui reste optimisé WebP pour le site web).
 */
@ApiExcludeController()
@Controller('whatsapp')
export class WhatsappMediaController {
  private readonly allowedOrigins: string[];

  constructor(private readonly config: ConfigService) {
    this.allowedOrigins = [
      this.config.get<string>('API_PUBLIC_URL'),
      this.config.get<string>('S3_PUBLIC_URL'),
      this.config.get<string>('S3_ENDPOINT'),
    ].filter((v): v is string => Boolean(v));
  }

  @Get('media-proxy')
  async proxyAsJpeg(@Query('src') src: string, @Res() res: Response): Promise<void> {
    if (!src || !this.allowedOrigins.some((origin) => src.startsWith(origin))) {
      throw new BadRequestException('Source non autorisée');
    }

    const upstream = await fetch(src);
    if (!upstream.ok) {
      throw new BadRequestException('Image source introuvable');
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    const jpeg = await sharp(buffer).jpeg({ quality: 85 }).toBuffer();

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(jpeg);
  }
}
