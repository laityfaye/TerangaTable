import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const TENANT_ROLES = ['manager', 'serveur', 'caissier', 'cuisinier', 'livreur'] as const;
type TenantRole = (typeof TENANT_ROLES)[number];

export class CreateUserDto {
  @ApiProperty({ example: 'mamadou@restaurant.sn' })
  @IsEmail({}, { message: 'Email invalide' })
  email!: string;

  @ApiProperty({ example: 'Mamadou' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Diallo' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiPropertyOptional({ example: '+221 77 000 00 00' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: TENANT_ROLES, example: 'serveur' })
  @IsEnum(TENANT_ROLES, {
    message: `Rôle invalide. Valeurs autorisées : ${TENANT_ROLES.join(', ')}`,
  })
  role!: TenantRole;

  @ApiProperty({ example: 'MotDePasse123!', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  password!: string;
}
