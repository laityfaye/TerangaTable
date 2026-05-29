import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const EVENT_TRIGGERS = [
  'order.created',
  'order.state_changed',
  'payment.received',
  'product.unavailable',
] as const;

export type EventTrigger = (typeof EVENT_TRIGGERS)[number];

export class ConditionDto {
  @ApiProperty({ example: 'order.total' })
  @IsString()
  @IsNotEmpty()
  field!: string;

  @ApiProperty({
    example: 'gt',
    enum: [
      'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
      'contains', 'starts_with',
      'in', 'not_in',
      'is_null', 'is_not_null',
      'between', 'time_between',
    ],
  })
  @IsString()
  @IsNotEmpty()
  operator!: string;

  @ApiPropertyOptional({ description: 'Valeur de comparaison (absent pour is_null/is_not_null)' })
  @IsOptional()
  value?: unknown;
}

export class ActionDto {
  @ApiProperty({
    example: 'notify_role',
    enum: [
      'notify_role', 'notify_user', 'update_field',
      'set_tag', 'apply_discount', 'change_status',
      'send_webhook', 'block_action',
    ],
  })
  @IsString()
  @IsNotEmpty()
  type!: string;

  [key: string]: unknown;
}

export class CreateRuleDto {
  @ApiProperty({ example: 'Alerte grande commande' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ enum: EVENT_TRIGGERS })
  @IsIn(EVENT_TRIGGERS)
  event_trigger!: string;

  @ApiProperty({ type: [ConditionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConditionDto)
  conditions!: ConditionDto[];

  @ApiProperty({ enum: ['AND', 'OR'], default: 'AND' })
  @IsEnum(['AND', 'OR'])
  condition_logic!: 'AND' | 'OR';

  @ApiProperty({ type: [ActionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActionDto)
  actions!: ActionDto[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  priority?: number;
}
