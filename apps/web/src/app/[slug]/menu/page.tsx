import { notFound } from 'next/navigation';
import { fetchVitrineData, fetchVitrineMenu } from '@/lib/vitrine-api';
import MenuClient from '@/components/vitrine/menu-client';

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ table?: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const data = await fetchVitrineData(slug);
    const baseUrl = process.env['NEXT_PUBLIC_BASE_URL'] ?? 'https://terangatable.com';
    const cityName = data.region.name;
    const title = `Menu — ${data.name}`;
    const description = `Découvrez le menu complet de ${data.name} à ${cityName} : plats, spécialités africaines et boissons.`;

    return {
      title,
      description,
      keywords: [`menu ${data.name}`, `carte ${data.name}`, `plats ${cityName}`, data.name, cityName],
      alternates: { canonical: `${baseUrl}/${slug}/menu` },
      openGraph: { title, description, type: 'website', url: `${baseUrl}/${slug}/menu` },
    };
  } catch {
    return { title: 'Menu' };
  }
}

export default async function MenuPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { table } = await searchParams;

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
      tableNumber={table ?? null}
    />
  );
}
