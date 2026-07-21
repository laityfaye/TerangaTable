import { IsUUID, IsOptional, IsNumber, Min, IsString, IsBoolean, IsIn, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
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
  @ApiProperty()
  @IsBoolean()
  enabled!: boolean;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  points_per_amount!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  redemption_points!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  redemption_value!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  expiry_days!: number;

  @ApiProperty({ enum: ['percent', 'amount'] })
  @IsIn(['percent', 'amount'])
  vip_threshold_type!: 'percent' | 'amount';

  @ApiProperty()
  @IsNumber()
  @Min(0)
  vip_threshold_value!: number;

  @ApiPropertyOptional({ type: [LoyaltyRewardDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LoyaltyRewardDto)
  rewards?: LoyaltyRewardDto[];
}
