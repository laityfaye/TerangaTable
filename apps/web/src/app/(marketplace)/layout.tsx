import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s — TérangaTable',
    default: 'Découvrez les restaurants — TérangaTable',
  },
  description: 'Trouvez les meilleurs restaurants africains près de chez vous. Menus du jour, livraison, réservations et avis clients sur TérangaTable.',
  openGraph: {
    siteName: 'TérangaTable',
    type: 'website',
    locale: 'fr_FR',
  },
};

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAFAF8]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
      {children}
    </div>
  );
}
