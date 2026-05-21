import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaymentMethodEnum } from './payment-method.enum';

export { PaymentMethodEnum };

export class CreatePaymentDto {
  @ApiProperty({ description: 'ID de la commande' })
  @IsUUID()
  @IsNotEmpty()
  order_id!: string;

  @ApiProperty({ enum: PaymentMethodEnum, enumName: 'PaymentMethodEnum' })
  @IsEnum(PaymentMethodEnum)
  method!: PaymentMethodEnum;

  @ApiProperty({ description: 'Montant en unité de la devise locale', minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Type(() => Number)
  amount!: number;

  @ApiPropertyOptional({ description: 'Référence de transaction (Wave, Orange Money…)' })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiPropertyOptional({ description: 'Métadonnées supplémentaires' })
  @IsOptional()
  metadata?: Record<string, unknown>;
}
