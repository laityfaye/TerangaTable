import { IsOptional, IsEnum, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListCustomersDto {
  @ApiPropertyOptional({ enum: ['new', 'regular', 'vip', 'inactive'] })
  @IsOptional()
  @IsEnum(['new', 'regular', 'vip', 'inactive'])
  segment?: 'new' | 'regular' | 'vip' | 'inactive';

  @ApiPropertyOptional({ description: 'Recherche nom, email, téléphone' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['total_spent', 'last_visit_at', 'total_orders', 'created_at'] })
  @IsOptional()
  @IsEnum(['total_spent', 'last_visit_at', 'total_orders', 'created_at'])
  sort_by?: 'total_spent' | 'last_visit_at' | 'total_orders' | 'created_at';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sort_order?: 'asc' | 'desc';

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}
