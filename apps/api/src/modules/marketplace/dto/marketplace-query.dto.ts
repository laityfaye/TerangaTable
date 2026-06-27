import { IsOptional, IsString, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class MarketplaceQueryDto {
  /** Slug de la région/ville (ex: "dakar", "thies") */
  @IsOptional() @IsString()
  city_slug?: string;

  /** Type de cuisine (ex: "senegalaise", "fast-food", "grillades") */
  @IsOptional() @IsString()
  cuisine?: string;

  /** Gamme de prix : "1" = budget, "2" = moyen, "3" = premium */
  @IsOptional() @IsString()
  budget?: string;

  /** Ne montrer que les restaurants ouverts maintenant */
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  open_now?: boolean;

  /** Ne montrer que les restaurants avec livraison */
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  delivery?: boolean;

  /** Ne montrer que les restaurants avec réservation en ligne */
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  reservations?: boolean;

  /** Recherche textuelle */
  @IsOptional() @IsString()
  q?: string;

  /** Page (défaut: 1) */
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1)
  page?: number = 1;

  /** Nombre de résultats par page (défaut: 20, max: 50) */
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) @Max(50)
  per_page?: number = 20;

  /** Latitude de l'utilisateur (pour tri par distance) */
  @IsOptional() @Type(() => Number) @IsNumber()
  lat?: number;

  /** Longitude de l'utilisateur (pour tri par distance) */
  @IsOptional() @Type(() => Number) @IsNumber()
  lng?: number;

  /** Rayon maximum autour de l'utilisateur, en km (ex: 0.5 = 500m, 1 = 1km) */
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  max_distance?: number;

  /** Tri : "distance" | "rating" | "popular" | "new" */
  @IsOptional() @IsString()
  sort?: string;
}
