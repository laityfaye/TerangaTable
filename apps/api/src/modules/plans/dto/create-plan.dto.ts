import { IsString, IsNumber, IsInt, IsObject, IsOptional, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlanDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Prix mensuel (devise locale)' })
  @IsNumber()
  @Min(0)
  price_monthly!: number;

  @ApiProperty({ description: 'Prix annuel (devise locale)' })
  @IsNumber()
  @Min(0)
  price_yearly!: number;

  @ApiProperty({ description: 'Nombre max d\'utilisateurs (-1 = illimité)' })
  @IsInt()
  max_users!: number;

  @ApiProperty({ description: 'Nombre max de produits (-1 = illimité)' })
  @IsInt()
  max_products!: number;

  @ApiProperty({ description: 'Modules inclus dans le plan (slug -> activé)' })
  @IsObject()
  features!: Record<string, boolean>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
