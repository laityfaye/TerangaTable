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
    return {
      title: `Menu — ${data.name}`,
      description: `Découvrez le menu complet de ${data.name} : plats, spécialités africaines et boissons.`,
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
