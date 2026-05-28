import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceQueryDto } from './dto/marketplace-query.dto';

@ApiTags('Marketplace publique')
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  /**
   * GET /v1/marketplace/cities
   * Liste toutes les villes/régions avec leur nombre de restaurants
   */
  @Get('cities')
  @SkipThrottle()
  @ApiOperation({ summary: 'Toutes les villes disponibles avec le nombre de restaurants' })
  getCities() {
    return this.marketplaceService.getCities();
  }

  /**
   * GET /v1/marketplace/restaurants?city_slug=dakar&cuisine=senegalaise&budget=2&open_now=true
   */
  @Get('restaurants')
  @ApiOperation({ summary: 'Liste filtrée et paginée des restaurants' })
  @ApiQuery({ name: 'city_slug', required: false })
  @ApiQuery({ name: 'cuisine', required: false })
  @ApiQuery({ name: 'budget', required: false })
  @ApiQuery({ name: 'open_now', required: false, type: Boolean })
  @ApiQuery({ name: 'delivery', required: false, type: Boolean })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiQuery({ name: 'lat', required: false, type: Number })
  @ApiQuery({ name: 'lng', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false })
  getRestaurants(@Query() query: MarketplaceQueryDto) {
    return this.marketplaceService.getRestaurants(query);
  }

  /**
   * GET /v1/marketplace/restaurants/:slug
   * Profil public complet d'un restaurant
   */
  @Get('restaurants/:slug')
  @SkipThrottle()
  @ApiOperation({ summary: 'Profil public d\'un restaurant' })
  async getRestaurantBySlug(@Param('slug') slug: string) {
    const restaurant = await this.marketplaceService.getRestaurantBySlug(slug);
    if (!restaurant) throw new NotFoundException(`Restaurant "${slug}" introuvable`);
    return restaurant;
  }

  /**
   * GET /v1/marketplace/search?q=thieboudienne&city_slug=dakar
   * Recherche rapide (autocomplete)
   */
  @Get('search')
  @ApiOperation({ summary: 'Recherche rapide de restaurants (autocomplete)' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'city_slug', required: false })
  search(@Query('q') q: string, @Query('city_slug') citySlug?: string) {
    return this.marketplaceService.search(q ?? '', citySlug);
  }

  /**
   * GET /v1/marketplace/featured?city_slug=dakar
   * Restaurants mis en avant / sponsorisés
   */
  @Get('featured')
  @ApiOperation({ summary: 'Restaurants featured et sponsorisés d\'une ville' })
  @ApiQuery({ name: 'city_slug', required: false })
  getFeatured(@Query('city_slug') citySlug?: string) {
    return this.marketplaceService.getFeatured(citySlug ?? 'dakar');
  }

  /**
   * GET /v1/marketplace/stats?city_slug=dakar
   * Statistiques publiques d'une ville
   */
  @Get('stats')
  @SkipThrottle()
  @ApiOperation({ summary: 'Statistiques publiques d\'une ville' })
  @ApiQuery({ name: 'city_slug', required: false })
  getStats(@Query('city_slug') citySlug?: string) {
    return this.marketplaceService.getStats(citySlug);
  }

  /**
   * GET /v1/marketplace/cuisines?city_slug=dakar
   * Types de cuisine disponibles dans une ville
   */
  @Get('cuisines')
  @SkipThrottle()
  @ApiOperation({ summary: 'Types de cuisine disponibles dans une ville' })
  @ApiQuery({ name: 'city_slug', required: true })
  getCuisines(@Query('city_slug') citySlug: string) {
    return this.marketplaceService.getCuisineTypes(citySlug ?? 'dakar');
  }

  /**
   * GET /v1/marketplace/menus-du-jour?city_slug=dakar
   * Produits actifs des restaurants ouverts (menus du jour)
   */
  @Get('menus-du-jour')
  @SkipThrottle()
  @ApiOperation({ summary: 'Produits actifs des restaurants ouverts d\'une ville' })
  @ApiQuery({ name: 'city_slug', required: true })
  getMenusDuJour(@Query('city_slug') citySlug: string) {
    return this.marketplaceService.getMenusDuJour(citySlug ?? 'dakar');
  }
}
