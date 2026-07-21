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

  // Champs spécifiques par type d'action (rules.evaluator.ts) — tous optionnels
  // car leur pertinence dépend de `type`, mais chacun doit porter un décorateur
  // sinon le ValidationPipe global (whitelist + forbidNonWhitelisted) le rejette.

  // notify_role / notify_user
  @ApiPropertyOptional({ description: 'notify_role' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ description: 'notify_role' })
  @IsOptional()
  @IsString()
  channel?: string;

  @ApiPropertyOptional({ description: 'notify_role / notify_user / block_action' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ description: 'notify_user' })
  @IsOptional()
  @IsString()
  userId?: string;

  // update_field
  @ApiPropertyOptional({ description: 'update_field — champ du payload contenant l\'ID de l\'entité (défaut: orderId)' })
  @IsOptional()
  @IsString()
  entityIdField?: string;

  @ApiPropertyOptional({ description: 'update_field', enum: ['order'] })
  @IsOptional()
  @IsString()
  entity?: string;

  @ApiPropertyOptional({ description: 'update_field / set_tag' })
  @IsOptional()
  @IsString()
  field?: string;

  @ApiPropertyOptional({ description: 'update_field — nouvelle valeur du champ' })
  @IsOptional()
  value?: unknown;

  // set_tag
  @ApiPropertyOptional({ description: 'set_tag' })
  @IsOptional()
  @IsString()
  tag?: string;

  // apply_discount
  @ApiPropertyOptional({ description: 'apply_discount' })
  @IsOptional()
  @IsString()
  discount_type?: string;

  @ApiPropertyOptional({ description: 'apply_discount' })
  @IsOptional()
  @IsNumber()
  discount_value?: number;

  // change_status
  @ApiPropertyOptional({ description: 'change_status' })
  @IsOptional()
  @IsString()
  target_status?: string;

  // send_webhook
  @ApiPropertyOptional({ description: 'send_webhook' })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({ description: 'send_webhook', enum: ['GET', 'POST', 'PUT'] })
  @IsOptional()
  @IsString()
  method?: string;

  @ApiPropertyOptional({ description: 'send_webhook — corps JSON en texte (supporte l\'interpolation {{champ}})' })
  @IsOptional()
  @IsString()
  body?: string;
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
