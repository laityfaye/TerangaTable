import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRegionDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  slug!: string;

  @ApiProperty()
  @IsString()
  country_code!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  platform_label?: string;

  @ApiProperty()
  @IsString()
  timezone!: string;

  @ApiProperty()
  @IsString()
  currency_code!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency_symbol?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone_prefix?: string;
}
