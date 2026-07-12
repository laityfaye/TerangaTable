import type { Metadata } from 'next';
import LandingPageClient from '@/components/home/landing-page-client';

export const metadata: Metadata = {
  title: 'TérangaTable — Caisse, menu digital & marketplace pour restaurants africains',
  description:
    "TérangaTable digitalise les restaurants d'Afrique : caisse POS, menu digital, commandes en ligne, réservations, livraison, CRM et marketplace pour trouver les meilleurs restaurants à Dakar, Thiès, Saint-Louis, Abidjan, Casablanca et Paris.",
  keywords: [
    // Marque
    'TérangaTable', 'Teranga Table',
    // Logiciel restaurant / SaaS
    'logiciel restaurant Afrique', 'caisse POS restaurant', 'caisse enregistreuse restaurant Sénégal',
    'menu digital restaurant', 'QR code menu restaurant', 'gestion de commandes restaurant',
    'logiciel de réservation restaurant', 'CRM fidélité restaurant', 'site vitrine restaurant',
    'application de livraison restaurant', 'ERP restauration Afrique', 'Shopify restaurant Afrique',
    'digitaliser mon restaurant', 'logiciel caisse restaurant Dakar',
    // Marketplace / découverte
    'trouver un restaurant', 'réserver une table en ligne', 'commander à manger en ligne',
    'livraison de repas', 'restaurant africain', 'cuisine sénégalaise', 'cuisine ivoirienne',
    'cuisine marocaine', 'restaurant sénégalais', 'meilleur restaurant',
    // Villes
    'restaurants Dakar', 'restaurants Thiès', 'restaurants Saint-Louis', 'restaurants Abidjan',
    'restaurants Casablanca', 'restaurants Paris', 'livraison repas Dakar', 'livraison repas Abidjan',
    'menus du jour Dakar', 'où manger à Dakar', 'où manger à Abidjan',
    // Pays
    'Sénégal', "Côte d'Ivoire", 'Maroc', 'France',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    title: 'TérangaTable — Shopify + Odoo de la restauration en Afrique',
    description:
      "Caisse POS, menu digital, commandes et réservations pour digitaliser les restaurants africains à Dakar, Abidjan, Casablanca.",
    type: 'website',
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TérangaTable — Caisse, menu digital & marketplace restaurants Afrique',
    description:
      "Digitalisez votre restaurant ou trouvez les meilleures adresses à Dakar, Abidjan, Casablanca et plus.",
  },
};

export default function HomePage() {
  return <LandingPageClient />;
}
