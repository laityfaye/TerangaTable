import { Controller, Get, Post, Param, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DeliveryDispatchService } from './delivery-dispatch.service';
import { AcceptDeliveryOfferDto } from './dto/accept-delivery-offer.dto';

@ApiTags('Livraisons — offres publiques')
@Controller('public/delivery-offers')
export class DeliveryOffersPublicController {
  constructor(private readonly dispatchService: DeliveryDispatchService) {}

  @Get(':deliveryId')
  @ApiOperation({ summary: 'Détail d\'une offre de livraison (jeton signé reçu par email)' })
  getOffer(@Param('deliveryId') deliveryId: string, @Query('token') token: string) {
    return this.dispatchService.getOffer(deliveryId, token ?? '');
  }

  @Post(':deliveryId/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accepter une offre de livraison — le premier livreur qui accepte l\'obtient' })
  accept(@Param('deliveryId') deliveryId: string, @Body() dto: AcceptDeliveryOfferDto) {
    return this.dispatchService.acceptOffer(deliveryId, dto.token);
  }
}
