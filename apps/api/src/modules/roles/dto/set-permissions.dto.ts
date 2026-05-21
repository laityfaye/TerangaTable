import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetPermissionsDto {
  @ApiProperty({
    description: 'Liste des IDs de permissions à assigner au rôle',
    example: ['uuid1', 'uuid2'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  permissionIds!: string[];
}
