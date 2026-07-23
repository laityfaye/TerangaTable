import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchVitrineData, fetchAllSlugs } from '@/lib/vitrine-api';
import VitrineNav from '@/components/vitrine/vitrine-nav';

export const revalidate = 300;

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const slugs = await fetchAllSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (/\.\w+$/.test(slug)) return { title: 'TérangaTable' };
  try {
    const data = await fetchVitrineData(slug);
    const ws = data.website_settings;
    const baseUrl = process.env['NEXT_PUBLIC_BASE_URL'] ?? 'https://terangatable.com';
    const cityName = data.region.name;

    // Mots-clés générés automatiquement quand le restaurateur n'a pas configuré
    // ses propres seo_keywords depuis le dashboard.
    const defaultKeywords = [
      data.name,
      `${data.name} ${cityName}`,
      `restaurant ${cityName}`,
      `restaurant ${data.region.countryName}`,
      `menu ${data.name}`,
      ...(data.modules?.includes('online_ordering')
        ? [`livraison ${cityName}`, `commander en ligne ${data.name}`, `commande en ligne ${cityName}`]
        : []),
      ...(data.modules?.includes('reservations')
        ? [`réserver une table ${data.name}`, `réservation restaurant ${cityName}`]
        : []),
      'TérangaTable',
    ];

    return {
      title: ws?.seo_title ?? `${data.name} — TérangaTable`,
      description:
        ws?.seo_description ?? `Découvrez ${data.name}, restaurant africain authentique à ${cityName}. Menu, réservation et commande en ligne.`,
      keywords: ws?.seo_keywords ?? defaultKeywords,
      openGraph: {
        type: 'website',
        locale: data.region.locale,
        url: `${baseUrl}/${slug}`,
        siteName: data.name,
        title: ws?.seo_title ?? data.name,
        description: ws?.seo_description ?? undefined,
        images: ws?.hero_image_url ? [{ url: ws.hero_image_url }] : [],
      },
      alternates: { canonical: `${baseUrl}/${slug}` },
      icons: ws?.favicon_url ? [{ url: ws.favicon_url }] : undefined,
    };
  } catch {
    return { title: 'Restaurant — TérangaTable' };
  }
}

export default async function VitrineLayout({ children, params }: Props) {
  const { slug } = await params;

  // Browser auto-requests (sw.js, favicon.ico, robots.txt…) must not be
  // treated as restaurant slugs — return 404 before hitting the backend.
  if (/\.\w+$/.test(slug)) notFound();

  let data;
  try {
    data = await fetchVitrineData(slug);
  } catch {
    notFound();
  }

  const ws = data.website_settings;
  const primaryColor = ws?.primary_color ?? '#C8553D';
  const secondaryColor = ws?.secondary_color ?? '#D4A843';
  const fontHeading = ws?.font_heading ?? 'Playfair Display, serif';
  const fontBody = ws?.font_body ?? 'DM Sans, sans-serif';

  const cssVars = {
    '--color-primary': primaryColor,
    '--color-secondary': secondaryColor,
    '--font-heading': fontHeading,
    '--font-body': fontBody,
  } as React.CSSProperties;

  const googleFontsUrl = buildGoogleFontsUrl(fontHeading, fontBody);

  return (
    <>
      {googleFontsUrl && (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href={googleFontsUrl} rel="stylesheet" />
        </>
      )}
      <div style={cssVars} className="min-h-screen font-body antialiased">
        <VitrineNav
          restaurantName={data.name}
          logoUrl={ws?.logo_url ?? null}
          slug={slug}
          hasReservations={data.modules?.includes('reservations') ?? false}
          hasOrdering={data.modules?.includes('online_ordering') ?? true}
          hasReviews={data.modules?.includes('reviews') ?? false}
          primaryColor={primaryColor}
        />
        {children}
        <footer className="bg-[#1A1A18] text-white/60 py-8 text-center text-sm">
          <p>
            © {new Date().getFullYear()} {data.name} — Propulsé par{' '}
            <span className="text-[--color-primary]">TérangaTable</span>
          </p>
        </footer>
      </div>
    </>
  );
}

function buildGoogleFontsUrl(heading: string, body: string): string {
  const normalise = (f: string) => f.split(',')[0]?.trim() ?? '';

  const families = Array.from(
    new Set([normalise(heading), normalise(body)].filter(Boolean)),
  );

  if (families.length === 0) return '';

  // Toute police proposée dans le sélecteur du dashboard doit pouvoir être
  // chargée ici — pas de liste blanche, sinon les polices ajoutées côté UI
  // sans mise à jour de cette fonction s'affichent avec la police système.
  const params = families
    .map((f) => `family=${f.replace(/\s+/g, '+')}:wght@400;600;700`)
    .join('&');

  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}
