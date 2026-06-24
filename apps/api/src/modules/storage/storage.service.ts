import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const THUMBNAIL_SIZE = 400;

const WEBSITE_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp',
  'image/svg+xml',
  'image/x-icon', 'image/vnd.microsoft.icon',
];

const WEBSITE_MAX_SIZE: Record<string, number> = {
  logo:    2 * 1024 * 1024,
  hero:    5 * 1024 * 1024,
  favicon: 0.5 * 1024 * 1024,
  about:   3 * 1024 * 1024,
  gallery: 3 * 1024 * 1024,
};

export interface UploadResult {
  url: string;
  thumbnailUrl: string;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly config: ConfigService) {
    const endpoint = this.config.get<string>('S3_ENDPOINT', 'http://localhost:9000');
    const region = this.config.get<string>('S3_REGION', 'us-east-1');

    this.bucket = this.config.get<string>('S3_BUCKET', 'terangatable');
    this.publicUrl = this.config.get<string>('S3_PUBLIC_URL', endpoint);

    this.s3 = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId: this.config.get<string>('S3_ACCESS_KEY', 'minioadmin'),
        secretAccessKey: this.config.get<string>('S3_SECRET_KEY', 'minioadmin'),
      },
      forcePathStyle: true, // requis pour MinIO
    });
  }

  async onModuleInit() {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`Bucket "${this.bucket}" créé`);
      } catch (createErr) {
        this.logger.warn(`Impossible de créer le bucket "${this.bucket}": ${String(createErr)}`);
        return;
      }
    }

    // Politique lecture publique anonyme — nécessaire pour que le proxy nginx serve les images
    const policy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [{
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${this.bucket}/*`],
      }],
    });

    try {
      await this.s3.send(new PutBucketPolicyCommand({ Bucket: this.bucket, Policy: policy }));
      this.logger.log(`Politique publique appliquée sur le bucket "${this.bucket}"`);
    } catch (err) {
      this.logger.warn(`Impossible d'appliquer la politique du bucket "${this.bucket}": ${String(err)}`);
    }
  }

  async uploadImage(tenantId: string, file: Express.Multer.File): Promise<UploadResult> {
    this.validateFile(file);

    const uuid = randomUUID();
    const keyBase = `tenants/${tenantId}/products/${uuid}`;

    try {
      const [original, thumbnail] = await Promise.all([
        this.processAndUpload(file.buffer, `${keyBase}.webp`, false),
        this.processAndUpload(file.buffer, `${keyBase}_thumb.webp`, true),
      ]);

      return {
        url: this.buildUrl(original),
        thumbnailUrl: this.buildUrl(thumbnail),
      };
    } catch (err) {
      if (process.env['NODE_ENV'] !== 'production') {
        this.logger.warn(`MinIO non disponible, fallback filesystem local: ${String(err)}`);
        const processed = await sharp(file.buffer).webp({ quality: 85 }).toBuffer();
        const url = this.saveLocally(`${keyBase}.webp`, processed, 'webp');
        return { url, thumbnailUrl: url };
      }
      this.logger.error('Erreur upload MinIO', err);
      throw new InternalServerErrorException('Échec de l\'upload image');
    }
  }

  private async processAndUpload(
    buffer: Buffer,
    key: string,
    isThumbnail: boolean,
  ): Promise<string> {
    const pipeline = sharp(buffer).webp({ quality: 85 });

    if (isThumbnail) {
      pipeline.resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
        fit: 'cover',
        position: 'centre',
      });
    }

    const processed = await pipeline.toBuffer();

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: processed,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000',
      }),
    );

    return key;
  }

  private buildUrl(key: string): string {
    return `${this.publicUrl}/${this.bucket}/${key}`;
  }

  /** Remplace un préfixe d'endpoint interne par l'URL publique configurée.
   *  Utile pour corriger des URLs stockées avant que S3_PUBLIC_URL soit défini. */
  normalizeUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.startsWith(this.publicUrl)) return url;
    const endpoint = this.config.get<string>('S3_ENDPOINT', 'http://localhost:9000');
    if (url.startsWith(endpoint)) {
      return this.publicUrl + url.slice(endpoint.length);
    }
    return url;
  }

  async uploadWebsiteAsset(
    tenantId: string,
    file: Express.Multer.File,
    assetType: 'logo' | 'hero' | 'favicon' | 'about' | 'gallery',
  ): Promise<string> {
    if (!WEBSITE_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Type MIME non supporté. Acceptés : ${WEBSITE_MIME_TYPES.join(', ')}`,
      );
    }
    const maxSize = WEBSITE_MAX_SIZE[assetType] ?? MAX_SIZE_BYTES;
    if (file.size > maxSize) {
      throw new BadRequestException(
        `Fichier trop volumineux (max ${Math.round(maxSize / 1024 / 1024 * 10) / 10} Mo)`,
      );
    }

    const uuid  = randomUUID();
    const isSvg = file.mimetype === 'image/svg+xml';
    const isIco = file.mimetype === 'image/x-icon' || file.mimetype === 'image/vnd.microsoft.icon';
    const ext   = isSvg ? 'svg' : isIco ? 'ico' : 'webp';
    const key   = `tenants/${tenantId}/website/${assetType}/${uuid}.${ext}`;

    // Process image (skip sharp for vector/binary formats)
    let body: Buffer;
    let contentType: string;
    try {
      if (isSvg) {
        body = file.buffer;
        contentType = 'image/svg+xml';
      } else if (isIco) {
        body = file.buffer;
        contentType = 'image/x-icon';
      } else {
        body = await sharp(file.buffer).webp({ quality: 85 }).toBuffer();
        contentType = 'image/webp';
      }
    } catch (err) {
      this.logger.error(`Erreur traitement image (${assetType})`, err);
      throw new BadRequestException('Fichier image invalide ou corrompu');
    }

    // Try MinIO upload; fall back to local disk in development
    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          CacheControl: 'public, max-age=31536000',
        }),
      );
      return this.buildUrl(key);
    } catch (s3Err) {
      if (process.env['NODE_ENV'] !== 'production') {
        this.logger.warn(
          `MinIO non disponible, fallback filesystem local (${assetType}): ${String(s3Err)}`,
        );
        return this.saveLocally(key, body, ext);
      }
      this.logger.error(`Erreur upload MinIO (${assetType})`, s3Err);
      throw new InternalServerErrorException('Échec de l\'upload');
    }
  }

  private saveLocally(key: string, body: Buffer, _ext: string): string {
    const uploadsRoot = path.join(process.cwd(), 'uploads');
    const filePath    = path.join(uploadsRoot, key);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, body);
    const port = process.env['PORT'] ?? '3001';
    return `http://localhost:${port}/uploads/${key}`;
  }

  private validateFile(file: Express.Multer.File): void {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Type MIME non supporté. Acceptés : ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new BadRequestException('Fichier trop volumineux (max 5 MB)');
    }
  }
}
