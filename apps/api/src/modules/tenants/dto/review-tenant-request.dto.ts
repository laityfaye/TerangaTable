import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewDecision } from './review-decision.enum';
import { IsLooseUuid } from '../../../common/validators/is-loose-uuid.decorator';

export { ReviewDecision };

export class ReviewTenantRequestDto {
  @ApiProperty({ enum: ReviewDecision, enumName: 'ReviewDecision' })
  @IsEnum(ReviewDecision)
  decision!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsLooseUuid()
  planId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
