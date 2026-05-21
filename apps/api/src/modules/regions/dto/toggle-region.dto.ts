import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleRegionDto {
  @ApiProperty()
  @IsBoolean()
  is_active!: boolean;
}
