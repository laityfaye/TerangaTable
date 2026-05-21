import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignDeliveryDto {
  @ApiProperty()
  @IsUUID()
  order_id!: string;

  @ApiProperty()
  @IsUUID()
  agent_id!: string;
}
