import { IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TestRuleDto {
  @ApiProperty({
    description: 'Payload simulé correspondant à l\'event_trigger de la règle',
    example: {
      tenantId: 'uuid',
      orderId: 'uuid',
      order: { total: 75000, type: 'delivery', items_count: 3 },
    },
  })
  @IsObject()
  @IsNotEmpty()
  payload!: Record<string, unknown>;
}
