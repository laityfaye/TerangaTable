import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class UpsertCustomFieldValueDto {
  @ApiProperty()
  @IsUUID()
  custom_field_id!: string;

  @ApiProperty()
  @IsUUID()
  entity_id!: string;

  @ApiProperty({ example: 'product' })
  @IsString()
  @IsNotEmpty()
  entity_type!: string;

  @ApiProperty({ description: 'Valeur (string, number, boolean, ou date ISO)' })
  value!: string | number | boolean | null;
}
