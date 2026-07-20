import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { AudioGuidesService } from './audio-guides.service';
import { AudioGuidesController } from './audio-guides.controller';

@Module({
  imports: [StorageModule],
  controllers: [AudioGuidesController],
  providers: [AudioGuidesService],
})
export class AudioGuidesModule {}
