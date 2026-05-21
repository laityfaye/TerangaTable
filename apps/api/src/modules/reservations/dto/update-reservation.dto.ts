import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsUUID,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateReservationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  table_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  reserved_at?: string;

  @ApiPropertyOptional({ minimum: 15 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  duration_min?: number;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  party_size?: number;

  @ApiPropertyOptional({
    enum: ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'],
  })
  @IsOptional()
  @IsEnum(['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'])
  status?: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
