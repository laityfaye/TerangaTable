import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { AudioGuidesService } from './audio-guides.service';

@ApiTags('Audio Guides')
@Controller('audio-guides')
export class AudioGuidesController {
  constructor(private readonly audioGuidesService: AudioGuidesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Liste des guides audio et leur statut d\'enregistrement (SuperAdmin)' })
  list() {
    return this.audioGuidesService.list();
  }

  @Get(':key')
  @ApiOperation({ summary: "URL du guide audio wolof pour une clé donnée (public — utilisé par le widget)" })
  getByKey(@Param('key') key: string) {
    return this.audioGuidesService.getByKey(key);
  }

  @Post(':key')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: "Déposer / remplacer l'enregistrement audio wolof d'un guide (SuperAdmin)" })
  upload(
    @Param('key') key: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    return this.audioGuidesService.upload(key, file);
  }

  @Delete(':key')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Supprimer l'enregistrement audio wolof d'un guide (SuperAdmin)" })
  remove(@Param('key') key: string) {
    return this.audioGuidesService.remove(key);
  }
}
