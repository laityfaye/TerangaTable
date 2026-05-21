import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsInt,
  IsIn,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';

export const FIELD_TYPES = ['string', 'number', 'boolean', 'date', 'select', 'text'] as const;
export type CustomFieldTypeDto = typeof FIELD_TYPES[number];

export class CreateCustomFieldDto {
  @ApiProperty({ example: 'product', enum: ['product', 'order', 'customer'] })
  @IsString()
  entity_type!: string;

  @ApiProperty({ example: 'Numéro de lot' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  label!: string;

  @ApiPropertyOptional({ example: 'numero_lot', description: 'snake_case, auto-généré depuis label si absent' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiProperty({ enum: FIELD_TYPES })
  @IsIn(FIELD_TYPES)
  field_type!: CustomFieldTypeDto;

  @ApiPropertyOptional({ type: [String], description: 'Options pour type=select' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  is_required?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  is_shown_on_vitrine?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;
}
