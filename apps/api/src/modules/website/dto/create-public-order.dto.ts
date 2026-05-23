import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PublicOrderItemDto {
  @ApiProperty()
  @IsUUID()
  product_id!: string;

  @ApiProperty({ minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreatePublicOrderDto {
  /** dine_in = commande sur place via QR code */
  @ApiProperty({ enum: ['takeaway', 'online', 'dine_in'] })
  @IsEnum(['takeaway', 'online', 'dine_in'])
  type!: 'takeaway' | 'online' | 'dine_in';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customer_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customer_phone?: string;

  /** Numéro de table (ex: "12", "Terrasse A") — transmis par le QR code */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  table_number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [PublicOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PublicOrderItemDto)
  items!: PublicOrderItemDto[];
}
