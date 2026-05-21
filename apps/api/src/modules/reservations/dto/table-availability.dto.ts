import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TableAvailabilityDto {
  @ApiProperty({ description: 'ISO datetime du créneau souhaité' })
  @IsDateString()
  date!: string;

  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  party_size!: number;

  @ApiPropertyOptional({ default: 90, minimum: 15 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  duration_min?: number;
}
