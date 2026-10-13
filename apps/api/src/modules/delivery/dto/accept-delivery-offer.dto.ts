import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AcceptDeliveryOfferDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token!: string;
}
