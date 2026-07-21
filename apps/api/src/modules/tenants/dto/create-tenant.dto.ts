import { IsString, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsLooseUuid } from '../../../common/validators/is-loose-uuid.decorator';

export class CreateTenantDto {
  @ApiProperty()
  @IsUUID()
  regionId!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  slug!: string;

  @ApiProperty()
  @IsLooseUuid()
  planId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerFirstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerLastName?: string;
}
