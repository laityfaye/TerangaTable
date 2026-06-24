import { notFound } from 'next/navigation';
import { fetchVitrineData, fetchFeaturedProducts } from '@/lib/vitrine-api';
import HeroSection from '@/components/vitrine/hero-section';
import SpecialitesSection from '@/components/vitrine/specialites-section';
import AboutSection from '@/components/vitrine/about-section';
import HorairesSection from '@/components/vitrine/horaires-section';
import GalerieSection from '@/components/vitrine/galerie-section';
import SocialSection from '@/components/vitrine/social-section';
import type { TenantSettings } from '@/types/vitrine';

export const revalidate = 300;

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function TenantVitrinePage({ params }: Props) {
  const { slug } = await params;

  let data;
  let featured;
  try {
    [data, featured] = await Promise.all([
      fetchVitrineData(slug),
      fetchFeaturedProducts(slug),
    ]);
  } catch {
    notFound();
  }

  const ws = data.website_settings;
  const settings = (data.settings ?? {}) as TenantSettings;
  const hasReservations = data.modules?.includes('reservations') ?? false;
  const primaryColor = ws?.primary_color ?? '#C8553D';
  const currencySymbol = data.region.currencySymbol;

  // ── sections_config: determine visibility and order ───────────────────────
  type SectionItem = { visible: boolean; order: number };
  const defaultConfig: Record<string, SectionItem> = {
    hero:        { visible: true, order: 0 },
    specialites: { visible: true, order: 1 },
    about:       { visible: true, order: 2 },
    horaires:    { visible: true, order: 3 },
    galerie:     { visible: true, order: 4 },
    contact:     { visible: true, order: 5 },
  };
  const rawConfig = (ws?.sections_config ?? {}) as Record<string, SectionItem>;
  const sectionsConfig: Record<string, SectionItem> = {
    ...defaultConfig,
    ...rawConfig,
  };

  function isVisible(key: string): boolean {
    return sectionsConfig[key]?.visible !== false;
  }

  // Collect gallery images: manual gallery first, then featured products, then hero fallback
  const manualGallery = settings.gallery_images ?? [];
  const productImages: string[] = featured
    .flatMap((p) => [p.imageUrl, ...(Array.isArray(p.images) ? p.images : [])])
    .filter((img): img is string => typeof img === 'string' && img.length > 0);
  const galleryImages: string[] = [...new Set([...manualGallery, ...productImages])]
    .slice(0, 6);
  if (galleryImages.length === 0 && ws?.hero_image_url) {
    galleryImages.push(ws.hero_image_url);
  }

  // Ordered section keys (non-hero)
  const orderedSections = Object.keys(sectionsConfig)
    .filter((k) => k !== 'hero')
    .sort((a, b) => (sectionsConfig[a]?.order ?? 99) - (sectionsConfig[b]?.order ?? 99));

  const jsonLd = buildRestaurantJsonLd(data, settings, featured, currencySymbol);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero is always first */}
      <HeroSection
        restaurantName={data.name}
        tagline={settings.description}
        heroImageUrl={ws?.hero_image_url ?? null}
        slug={slug}
        hasReservations={hasReservations}
        primaryColor={primaryColor}
      />

      {orderedSections.map((key) => {
        if (!isVisible(key)) return null;

        switch (key) {
          case 'specialites':
            return featured.length > 0 ? (
              <SpecialitesSection
                key="specialites"
                products={featured}
                currencySymbol={currencySymbol}
                slug={slug}
                primaryColor={primaryColor}
              />
            ) : null;

          case 'about':
            return settings.about_text || settings.about_chef || settings.about_image ? (
              <AboutSection
                key="about"
                restaurantName={data.name}
                aboutText={settings.about_text}
                aboutChef={settings.about_chef}
                aboutImage={settings.about_image ?? null}
                primaryColor={primaryColor}
              />
            ) : null;

          case 'horaires':
            return settings.opening_hours ? (
              <HorairesSection
                key="horaires"
                openingHours={settings.opening_hours}
                address={settings.address}
                phone={settings.phone}
                email={settings.email}
              />
            ) : null;

          case 'galerie':
            return galleryImages.length > 0 ? (
              <GalerieSection
                key="galerie"
                images={galleryImages}
                restaurantName={data.name}
              />
            ) : null;

          case 'contact':
            return ws?.social_links && Object.keys(ws.social_links).length > 0 ? (
              <SocialSection
                key="contact"
                socialLinks={ws.social_links}
                primaryColor={primaryColor}
              />
            ) : null;

          default:
            return null;
        }
      })}
    </>
  );
}

function buildRestaurantJsonLd(
  data: Awaited<ReturnType<typeof fetchVitrineData>>,
  settings: TenantSettings,
  featured: Awaited<ReturnType<typeof fetchFeaturedProducts>>,
  currencySymbol: string,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: data.name,
    servesCuisine: 'African cuisine',
    address: settings.address
      ? { '@type': 'PostalAddress', streetAddress: settings.address, addressLocality: data.region.name }
      : { '@type': 'PostalAddress', addressLocality: data.region.name },
    telephone: settings.phone,
    email: settings.email,
    hasMenu: featured.length > 0
      ? {
          '@type': 'Menu',
          hasMenuItem: featured.map((p) => ({
            '@type': 'MenuItem',
            name: p.name,
            description: p.description,
            offers: {
              '@type': 'Offer',
              price: String(p.basePrice),
              priceCurrency: currencySymbol,
            },
          })),
        }
      : undefined,
  };
}
