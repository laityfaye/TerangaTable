import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RefundPaymentDto {
  @ApiPropertyOptional({ description: 'Raison du remboursement' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  reason?: string;
}
