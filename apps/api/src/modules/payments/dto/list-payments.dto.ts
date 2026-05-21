import { IsDateString, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaymentMethodEnum } from './create-payment.dto';

export enum PaymentStatusEnum {
  pending  = 'pending',
  completed = 'completed',
  failed   = 'failed',
  refunded = 'refunded',
}

export class ListPaymentsDto {
  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  date_from?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  date_to?: string;

  @ApiPropertyOptional({ enum: PaymentMethodEnum })
  @IsEnum(PaymentMethodEnum)
  @IsOptional()
  method?: PaymentMethodEnum;

  @ApiPropertyOptional({ enum: PaymentStatusEnum })
  @IsEnum(PaymentStatusEnum)
  @IsOptional()
  status?: PaymentStatusEnum;

  @ApiPropertyOptional({ default: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsInt()
  @Min(1)
  @Max(200)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 50;
}
