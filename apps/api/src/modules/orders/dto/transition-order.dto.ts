import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransitionOrderDto {
  @ApiProperty({ description: 'ID de la transition à exécuter' })
  @IsUUID()
  transitionId!: string;
}
