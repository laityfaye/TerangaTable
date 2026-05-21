import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TenantStatusAction } from './tenant-status-action.enum';

export { TenantStatusAction };

export class UpdateTenantStatusDto {
  @ApiProperty({ enum: TenantStatusAction, enumName: 'TenantStatusAction' })
  @IsEnum(TenantStatusAction)
  status!: string;
}
