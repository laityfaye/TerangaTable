import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInvitationDto {
  @ApiProperty({ example: 'nouveau.collegue@restaurant.sn' })
  @IsEmail({}, { message: 'Email invalide' })
  email!: string;

  @ApiProperty({ example: 'serveur', description: 'Slug du rôle à attribuer' })
  @IsString()
  @IsNotEmpty()
  roleSlug!: string;
}
