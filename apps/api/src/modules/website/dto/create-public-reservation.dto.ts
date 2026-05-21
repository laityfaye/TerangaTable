import { IsString, IsEmail, IsOptional, IsInt, Min, Max, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePublicReservationDto {
  @ApiProperty({ example: '2026-05-20' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Format date invalide (YYYY-MM-DD)' })
  date!: string;

  @ApiProperty({ example: '19:30' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'Format heure invalide (HH:mm)' })
  time!: string;

  @ApiProperty({ example: 4, minimum: 1, maximum: 50 })
  @IsInt()
  @Min(1)
  @Max(50)
  party_size!: number;

  @ApiProperty({ example: 'Moussa Diallo' })
  @IsString()
  customer_name!: string;

  @ApiProperty({ example: '+221 77 123 45 67' })
  @IsString()
  customer_phone!: string;

  @ApiPropertyOptional({ example: 'moussa@example.com' })
  @IsEmail()
  @IsOptional()
  customer_email?: string;

  @ApiPropertyOptional({ example: 'Table en terrasse de préférence' })
  @IsString()
  @IsOptional()
  notes?: string;
}
