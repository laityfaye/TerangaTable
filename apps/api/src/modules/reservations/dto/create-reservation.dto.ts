import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsInt,
  Min,
  IsUUID,
  IsDateString,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiProperty({ example: 'Fatou Diallo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  customer_name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  customer_email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  customer_phone?: string;

  @ApiPropertyOptional({ description: 'ID client existant (CRM)' })
  @IsOptional()
  @IsUUID()
  customer_id?: string;

  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  party_size!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  table_id?: string;

  @ApiProperty({ description: 'ISO datetime de la réservation' })
  @IsDateString()
  reserved_at!: string;

  @ApiPropertyOptional({ default: 90, minimum: 15 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  duration_min?: number;

  @ApiProperty({ enum: ['website', 'phone', 'walk_in', 'api'] })
  @IsEnum(['website', 'phone', 'walk_in', 'api'])
  source!: 'website' | 'phone' | 'walk_in' | 'api';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
