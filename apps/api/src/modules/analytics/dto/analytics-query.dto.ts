import { IsIn, IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AnalyticsQueryDto {
  @ApiPropertyOptional({ enum: ['today', '7d', '30d', 'custom'], default: '7d' })
  @IsOptional()
  @IsIn(['today', '7d', '30d', 'custom'])
  period?: 'today' | '7d' | '30d' | 'custom';

  @ApiPropertyOptional({ description: 'Date ISO (custom period)' })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional({ description: 'Date ISO (custom period)' })
  @IsOptional()
  @IsDateString()
  date_to?: string;
}

export class RevenueQueryDto extends AnalyticsQueryDto {
  @ApiPropertyOptional({ enum: ['day', 'week', 'month'] })
  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  granularity?: 'day' | 'week' | 'month';
}

export class ExportQueryDto extends AnalyticsQueryDto {
  @ApiPropertyOptional({ enum: ['csv', 'pdf'], default: 'csv' })
  @IsOptional()
  @IsIn(['csv', 'pdf'])
  @IsString()
  format?: 'csv' | 'pdf';
}
