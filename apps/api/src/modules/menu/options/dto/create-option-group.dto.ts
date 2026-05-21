import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';
import { OptionGroupType } from './option-group-type.enum';

export { OptionGroupType };

export class CreateOptionGroupDto {
  @ApiProperty({ example: 'Cuisson' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @ApiProperty({ enum: OptionGroupType, enumName: 'OptionGroupType' })
  @IsEnum(OptionGroupType)
  type!: OptionGroupType;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  is_required?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  min_select?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  max_select?: number;
}
