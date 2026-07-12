import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RespondReviewDto {
  @ApiProperty({ description: 'Réponse publique du restaurateur à un avis' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  response!: string;
}
