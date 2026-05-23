import {
  IsOptional,
  IsString,
  IsBoolean,
  IsObject,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ContentConfigDto {
  @IsOptional() @IsString() description?:    string | null;
  @IsOptional() @IsString() about_text?:     string | null;
  @IsOptional() @IsString() about_chef?:     string | null;
  @IsOptional() @IsString() about_image_url?: string | null;
  @IsOptional() gallery_images?:             string[];
  @IsOptional() @IsString() phone?:          string | null;
  @IsOptional() @IsString() address?:        string | null;
  @IsOptional() @IsString() email?:          string | null;
}

export class UpdateWebsiteSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  theme_id?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  custom_domain?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_published?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_maintenance?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(7)
  primary_color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(7)
  secondary_color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logo_url?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  favicon_url?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hero_image_url?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  seo_title?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seo_description?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seo_keywords?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  google_analytics?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  sections_config?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  social_links?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  font_heading?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  font_body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  content_config?: Record<string, unknown>;
}
