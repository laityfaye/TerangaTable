import { IsUUID, IsOptional, IsNumber, Min, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EarnPointsDto {
  @ApiProperty()
  @IsUUID()
  customer_id!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  order_id?: string;

  @ApiProperty({ description: 'Montant payé (pour calculer les points)' })
  @IsNumber()
  @Min(0)
  amount!: number;
}

export class RedeemPointsDto {
  @ApiProperty()
  @IsUUID()
  customer_id!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  order_id?: string;

  @ApiProperty({ description: 'Nombre de points à dépenser' })
  @IsNumber()
  @Min(1)
  points!: number;
}

export class LoyaltyRewardDto {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  points_required!: number;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiProperty({ enum: ['discount', 'gift', 'upgrade'] })
  @IsString()
  type!: 'discount' | 'gift' | 'upgrade';
}

export class LoyaltySettingsDto {
  enabled!: boolean;
  points_per_amount!: number;
  redemption_points!: number;
  redemption_value!: number;
  expiry_days!: number;
  vip_threshold_type!: 'percent' | 'amount';
  vip_threshold_value!: number;
  rewards?: LoyaltyRewardDto[];
}
