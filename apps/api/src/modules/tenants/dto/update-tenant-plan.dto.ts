import { ApiProperty } from '@nestjs/swagger';
import { IsLooseUuid } from '../../../common/validators/is-loose-uuid.decorator';

export class UpdateTenantPlanDto {
  @ApiProperty()
  @IsLooseUuid()
  planId!: string;
}
