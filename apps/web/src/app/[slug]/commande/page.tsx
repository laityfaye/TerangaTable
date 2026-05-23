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
    return {
      title: `Commander en ligne — ${data.name}`,
      description: `Passez votre commande en ligne chez ${data.name}. Livraison et à emporter disponibles.`,
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
