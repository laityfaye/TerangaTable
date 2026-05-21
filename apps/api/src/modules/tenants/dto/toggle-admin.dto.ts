import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleAdminDto {
  @ApiProperty()
  @IsBoolean()
  is_active!: boolean;
}
