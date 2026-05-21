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

  const jsonLd = buildRestaurantJsonLd(data, settings, featured, currencySymbol);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <HeroSection
        restaurantName={data.name}
        tagline={settings.description}
        heroImageUrl={ws?.hero_image_url ?? null}
        slug={slug}
        hasReservations={hasReservations}
        primaryColor={primaryColor}
      />

      {featured.length > 0 && (
        <SpecialitesSection
          products={featured}
          currencySymbol={currencySymbol}
          slug={slug}
          primaryColor={primaryColor}
        />
      )}

      {(settings.about_text || settings.about_chef) && (
        <AboutSection
          restaurantName={data.name}
          aboutText={settings.about_text}
          aboutChef={settings.about_chef}
          aboutImage={settings.about_image ?? null}
          primaryColor={primaryColor}
        />
      )}

      {settings.opening_hours && (
        <HorairesSection
          openingHours={settings.opening_hours}
          address={settings.address}
          phone={settings.phone}
          email={settings.email}
        />
      )}

      {ws?.hero_image_url && (
        <GalerieSection heroImageUrl={ws.hero_image_url} restaurantName={data.name} />
      )}

      {ws?.social_links && Object.keys(ws.social_links).length > 0 && (
        <SocialSection socialLinks={ws.social_links} primaryColor={primaryColor} />
      )}
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
