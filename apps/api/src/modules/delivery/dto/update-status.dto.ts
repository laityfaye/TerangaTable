import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDeliveryStatusDto {
  @ApiProperty({ enum: ['assigned', 'picked_up', 'en_route', 'delivered', 'failed'] })
  @IsEnum(['assigned', 'picked_up', 'en_route', 'delivered', 'failed'])
  status!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
