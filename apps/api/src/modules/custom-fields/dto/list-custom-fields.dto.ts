import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ListCustomFieldsDto {
  @ApiPropertyOptional({ enum: ['product', 'order', 'customer'] })
  @IsOptional()
  @IsString()
  entity_type?: string;
}
