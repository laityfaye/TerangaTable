import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const TENANT_ROLES = ['manager', 'serveur', 'caissier', 'cuisinier', 'livreur'] as const;
type TenantRole = (typeof TENANT_ROLES)[number];

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Mamadou' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Diallo' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: '+221 77 000 00 00' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: TENANT_ROLES })
  @IsOptional()
  @IsEnum(TENANT_ROLES, {
    message: `Rôle invalide. Valeurs autorisées : ${TENANT_ROLES.join(', ')}`,
  })
  role?: TenantRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
