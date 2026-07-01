import type { Metadata } from 'next';
import { Sora, DM_Sans } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://terangatable.cloud'),
  title: {
    default: 'TérangaTable — Restaurants africains en ligne',
    template: '%s — TérangaTable',
  },
  description:
    'TérangaTable : découvrez les meilleurs restaurants africains à Dakar, Thiès, Abidjan, Casablanca et plus. Menus du jour, livraison et réservations en ligne.',
  keywords: [
    'restaurants Dakar', 'restaurants Thiès', 'restaurants Abidjan', 'restaurants Casablanca',
    'restaurant africain', 'livraison repas Sénégal', 'menus du jour Dakar', 'TérangaTable',
  ],
  authors: [{ name: 'TérangaTable', url: 'https://terangatable.cloud' }],
  creator: 'TérangaTable',
  openGraph: {
    siteName: 'TérangaTable',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@terangatable',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${sora.variable} ${dmSans.variable}`}>
      <body className="font-body antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
