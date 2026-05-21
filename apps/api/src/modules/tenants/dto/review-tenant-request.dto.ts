import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewDecision } from './review-decision.enum';

export { ReviewDecision };

export class ReviewTenantRequestDto {
  @ApiProperty({ enum: ReviewDecision, enumName: 'ReviewDecision' })
  @IsEnum(ReviewDecision)
  decision!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  planId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
