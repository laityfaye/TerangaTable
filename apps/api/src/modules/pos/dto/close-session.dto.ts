import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class CloseSessionDto {
  @ApiProperty({ description: 'Espèces comptées à la fermeture', example: 75000 })
  @IsNumber()
  @Min(0)
  closing_amount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  notes?: string;
}
