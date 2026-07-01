import { IsUUID, IsOptional } from 'class-validator';

export class AssignAdminDto {
  @IsUUID()
  @IsOptional()
  userId: string | null = null;
}
