import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9_]+$/, { message: 'Le slug ne doit contenir que des lettres minuscules, chiffres et underscores' })
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Couleur hex invalide (ex: #3B82F6)' })
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_initial?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_terminal?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  triggers_alert?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;
}
