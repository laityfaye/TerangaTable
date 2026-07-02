import { notFound } from 'next/navigation';
import { fetchVitrineData, fetchVitrineMenu } from '@/lib/vitrine-api';
import MenuClient from '@/components/vitrine/menu-client';

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const data = await fetchVitrineData(slug);
    const baseUrl = process.env['NEXT_PUBLIC_BASE_URL'] ?? 'https://terangatable.com';
    const cityName = data.region.name;
    const title = `Commander en ligne — ${data.name}`;
    const description = `Passez votre commande en ligne chez ${data.name} à ${cityName}. Livraison et à emporter disponibles.`;

    return {
      title,
      description,
      keywords: [`commander en ligne ${data.name}`, `livraison ${cityName}`, `commande à emporter ${data.name}`, data.name, cityName],
      alternates: { canonical: `${baseUrl}/${slug}/commande` },
      openGraph: { title, description, type: 'website', url: `${baseUrl}/${slug}/commande` },
    };
  } catch {
    return { title: 'Commander en ligne' };
  }
}

export default async function CommandePage({ params }: Props) {
  const { slug } = await params;

  let data;
  let categories;
  try {
    [data, categories] = await Promise.all([
      fetchVitrineData(slug),
      fetchVitrineMenu(slug),
    ]);
  } catch {
    notFound();
  }

  return (
    <MenuClient
      categories={categories}
      currencySymbol={data.region.currencySymbol}
      slug={slug}
      primaryColor={data.website_settings?.primary_color ?? '#C8553D'}
      restaurantName={data.name}
      heroImageUrl={data.website_settings?.hero_image_url ?? null}
      logoUrl={data.website_settings?.logo_url ?? null}
    />
  );
}
