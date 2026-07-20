import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AUDIO_GUIDE_KEYS, AUDIO_GUIDE_KEY_SET } from './audio-guides.constants';

@Injectable()
export class AudioGuidesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  private assertKnownKey(key: string): void {
    if (!AUDIO_GUIDE_KEY_SET.has(key)) {
      throw new BadRequestException(`Guide audio inconnu : ${key}`);
    }
  }

  async list() {
    const rows = await this.prisma.audioGuide.findMany();
    const byKey = new Map(rows.map((r) => [r.key, r]));

    return AUDIO_GUIDE_KEYS.map(({ key, label, path }) => {
      const row = byKey.get(key);
      return {
        key,
        label,
        path,
        url: row?.url ?? null,
        updated_at: row?.updatedAt ?? null,
      };
    });
  }

  async getByKey(key: string) {
    this.assertKnownKey(key);
    const row = await this.prisma.audioGuide.findUnique({ where: { key } });
    return { key, url: row?.url ?? null };
  }

  async upload(key: string, file: Express.Multer.File) {
    this.assertKnownKey(key);

    const url = await this.storage.uploadAudioGuide(key, file);

    const row = await this.prisma.audioGuide.upsert({
      where: { key },
      create: { key, url },
      update: { url },
    });

    return { key, url: row.url, updated_at: row.updatedAt };
  }

  async remove(key: string) {
    this.assertKnownKey(key);
    await this.prisma.audioGuide.deleteMany({ where: { key } });
    return { key, url: null };
  }
}
