/**
 * Script de correction des slugs de rôles pour les tenants existants.
 * Renomme les anciens slugs anglais en français et ajoute les rôles manquants.
 * Usage : npx ts-node prisma/fix-roles.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SLUG_RENAMES: Record<string, string> = {
  server: 'serveur',
  cashier: 'caissier',
};

const MISSING_ROLES = [
  { name: 'Cuisinier', slug: 'cuisinier', description: 'Préparation des plats' },
  { name: 'Livreur', slug: 'livreur', description: 'Livraisons' },
];

async function main() {
  // 1. Renommer les slugs anglais
  for (const [oldSlug, newSlug] of Object.entries(SLUG_RENAMES)) {
    const result = await prisma.role.updateMany({
      where: { slug: oldSlug, isSystem: true },
      data: { slug: newSlug },
    });
    if (result.count > 0) {
      console.log(`✓ Renommé "${oldSlug}" → "${newSlug}" (${result.count} rôle(s))`);
    }
  }

  // 2. Ajouter les rôles manquants pour chaque tenant
  const tenants = await prisma.tenant.findMany({ select: { id: true, name: true } });
  console.log(`\nTraitement de ${tenants.length} tenant(s)...`);

  for (const tenant of tenants) {
    for (const role of MISSING_ROLES) {
      const existing = await prisma.role.findFirst({
        where: { tenantId: tenant.id, slug: role.slug },
      });
      if (!existing) {
        await prisma.role.create({
          data: { tenantId: tenant.id, ...role, isSystem: true },
        });
        console.log(`  ✓ Rôle "${role.slug}" ajouté pour "${tenant.name}"`);
      } else {
        console.log(`  — Rôle "${role.slug}" déjà présent pour "${tenant.name}"`);
      }
    }
  }

  console.log('\nCorrection terminée.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
