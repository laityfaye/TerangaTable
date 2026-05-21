import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class OpenSessionDto {
  @ApiProperty({ description: 'Fond de caisse initial en espèces', example: 50000 })
  @IsNumber()
  @Min(0)
  opening_amount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  notes?: string;
}
