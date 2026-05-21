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
      title: `Menu — ${data.name}`,
      description: `Découvrez le menu complet de ${data.name} : plats, spécialités africaines et boissons.`,
    };
  } catch {
    return { title: 'Menu' };
  }
}

export default async function MenuPage({ params }: Props) {
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
    <div className="pt-16">
      <MenuClient
        categories={categories}
        currencySymbol={data.region.currencySymbol}
        slug={slug}
        primaryColor={data.website_settings?.primary_color ?? '#C8553D'}
        restaurantName={data.name}
      />
    </div>
  );
}
