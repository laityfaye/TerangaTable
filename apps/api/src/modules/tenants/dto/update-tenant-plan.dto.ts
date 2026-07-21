import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTenantPlanDto {
  @ApiProperty()
  @IsUUID()
  planId!: string;
}
