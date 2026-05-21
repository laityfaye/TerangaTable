import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTransitionDto {
  @ApiPropertyOptional({ description: 'null = depuis n\'importe quel état' })
  @IsOptional()
  @IsUUID()
  from_state_id?: string | null;

  @ApiProperty()
  @IsUUID()
  to_state_id!: string;

  @ApiProperty({ example: 'Marquer prête' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['owner', 'manager', 'kitchen_staff'],
    description: 'Rôles autorisés à déclencher cette transition',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowed_roles?: string[];
}
