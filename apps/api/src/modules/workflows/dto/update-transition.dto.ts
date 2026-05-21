import { IsString, IsOptional, IsArray, IsUUID, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTransitionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  from_state_id?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  to_state_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowed_roles?: string[];
}
