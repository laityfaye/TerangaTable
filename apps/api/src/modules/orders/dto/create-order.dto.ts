import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OptionSelectionDto {
  @IsString()
  group_id!: string;

  @IsString()
  group_name!: string;

  @IsString()
  option_id!: string;

  @IsString()
  option_name!: string;

  @IsNumber()
  price_delta!: number;
}

export class CreateOrderItemDto {
  @ApiProperty()
  @IsUUID()
  product_id!: string;

  @ApiProperty({ minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({ type: [OptionSelectionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionSelectionDto)
  options?: OptionSelectionDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateOrderDto {
  @ApiProperty({ enum: ['dine_in', 'takeaway', 'delivery', 'online'] })
  @IsEnum(['dine_in', 'takeaway', 'delivery', 'online'])
  type!: 'dine_in' | 'takeaway' | 'delivery' | 'online';

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  table_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customer_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  delivery_address?: Record<string, unknown>;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
