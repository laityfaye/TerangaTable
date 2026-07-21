import { IsString, IsEmail, IsUUID, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTenantRequestDto {
  @ApiProperty()
  @IsUUID()
  regionId!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  ownerName!: string;

  @ApiProperty()
  @IsEmail()
  ownerEmail!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  restaurantName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ description: 'Plan suggéré côté formulaire selon la taille déclarée (indicatif — le SuperAdmin peut le changer à la validation)' })
  @IsOptional()
  @IsUUID()
  desiredPlanId?: string;
}
