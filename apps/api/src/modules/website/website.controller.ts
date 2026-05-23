import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebsiteService } from './website.service';
import { CreatePublicReservationDto } from './dto/create-public-reservation.dto';
import { CreatePublicOrderDto } from './dto/create-public-order.dto';

@ApiTags('Vitrine publique')
@Controller('public')
export class WebsiteController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get('slugs')
  @ApiOperation({ summary: 'Liste tous les slugs de restaurants publiés' })
  getAllSlugs() {
    return this.websiteService.getAllActiveSlugs();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Données publiques du restaurant (tenant + website_settings + modules)' })
  getPublicData(@Param('slug') slug: string) {
    if (slug.includes('.')) throw new NotFoundException();
    return this.websiteService.getPublicData(slug);
  }

  @Get(':slug/menu')
  @ApiOperation({ summary: 'Menu public : catégories + produits disponibles' })
  getMenu(@Param('slug') slug: string) {
    if (slug.includes('.')) throw new NotFoundException();
    return this.websiteService.getPublicMenu(slug);
  }

  @Get(':slug/featured')
  @ApiOperation({ summary: 'Produits mis en avant pour la page d\'accueil' })
  getFeatured(@Param('slug') slug: string) {
    if (slug.includes('.')) throw new NotFoundException();
    return this.websiteService.getFeaturedProducts(slug);
  }

  @Post(':slug/reservations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une réservation depuis le site vitrine' })
  createReservation(
    @Param('slug') slug: string,
    @Body() dto: CreatePublicReservationDto,
  ) {
    if (slug.includes('.')) throw new NotFoundException();
    return this.websiteService.createPublicReservation(slug, dto);
  }

  @Post(':slug/orders')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Passer une commande en ligne depuis le site vitrine' })
  createOrder(
    @Param('slug') slug: string,
    @Body() dto: CreatePublicOrderDto,
  ) {
    if (slug.includes('.')) throw new NotFoundException();
    return this.websiteService.createPublicOrder(slug, dto);
  }
}
