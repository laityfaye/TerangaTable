/**
 * Seed des permissions applicatives et des accès par défaut par rôle.
 * Idempotent — peut être relancé sans dupliquer.
 * Usage : npx ts-node prisma/seed-permissions.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Permissions ──────────────────────────────────────────────────────────────

const PERMISSIONS = [
  // Commandes
  { module: 'orders', action: 'view',   resource: 'order', description: 'Consulter les commandes' },
  { module: 'orders', action: 'create', resource: 'order', description: 'Créer une commande' },
  { module: 'orders', action: 'update', resource: 'order', description: 'Modifier le statut d\'une commande' },
  { module: 'orders', action: 'cancel', resource: 'order', description: 'Annuler une commande' },
  { module: 'orders', action: 'delete', resource: 'order', description: 'Supprimer une commande' },

  // Menu
  { module: 'menu', action: 'view',   resource: 'menu', description: 'Consulter le menu' },
  { module: 'menu', action: 'create', resource: 'menu', description: 'Créer produits et catégories' },
  { module: 'menu', action: 'update', resource: 'menu', description: 'Modifier produits et catégories' },
  { module: 'menu', action: 'delete', resource: 'menu', description: 'Supprimer produits et catégories' },

  // Point de vente
  { module: 'pos', action: 'view',   resource: 'pos', description: 'Accéder au point de vente' },
  { module: 'pos', action: 'use',    resource: 'pos', description: 'Encaisser des commandes' },
  { module: 'pos', action: 'refund', resource: 'pos', description: 'Effectuer un remboursement' },

  // Réservations
  { module: 'reservations', action: 'view',   resource: 'reservation', description: 'Consulter les réservations' },
  { module: 'reservations', action: 'create', resource: 'reservation', description: 'Créer une réservation' },
  { module: 'reservations', action: 'update', resource: 'reservation', description: 'Modifier une réservation' },
  { module: 'reservations', action: 'cancel', resource: 'reservation', description: 'Annuler une réservation' },

  // Analytique
  { module: 'analytics', action: 'view', resource: 'analytics', description: 'Consulter les statistiques' },

  // Clients
  { module: 'customers', action: 'view',   resource: 'customer', description: 'Consulter les clients' },
  { module: 'customers', action: 'create', resource: 'customer', description: 'Créer un client' },
  { module: 'customers', action: 'update', resource: 'customer', description: 'Modifier un client' },

  // Paramètres
  { module: 'settings', action: 'view', resource: 'settings', description: 'Consulter les paramètres' },
  { module: 'settings', action: 'edit', resource: 'settings', description: 'Modifier les paramètres' },

  // Livraison
  { module: 'delivery', action: 'view',   resource: 'delivery', description: 'Consulter les livraisons' },
  { module: 'delivery', action: 'manage', resource: 'delivery', description: 'Gérer les livraisons' },
];

// ── Accès par défaut par rôle slug ──────────────────────────────────────────

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  manager: [
    'orders.view', 'orders.create', 'orders.update', 'orders.cancel', 'orders.delete',
    'menu.view', 'menu.create', 'menu.update', 'menu.delete',
    'pos.view', 'pos.use', 'pos.refund',
    'reservations.view', 'reservations.create', 'reservations.update', 'reservations.cancel',
    'analytics.view',
    'customers.view', 'customers.create', 'customers.update',
    'settings.view', 'settings.edit',
    'delivery.view', 'delivery.manage',
  ],
  serveur: [
    'orders.view', 'orders.create', 'orders.update',
    'menu.view',
    'pos.view', 'pos.use',
    'reservations.view', 'reservations.create', 'reservations.update',
    'customers.view',
  ],
  caissier: [
    'orders.view',
    'pos.view', 'pos.use', 'pos.refund',
    'customers.view',
  ],
  cuisinier: [
    'orders.view', 'orders.update',
    'menu.view',
  ],
  livreur: [
    'orders.view',
    'delivery.view', 'delivery.manage',
  ],
};

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Upsert toutes les permissions
  console.log('Insertion des permissions...');
  const permMap: Record<string, string> = {};

  for (const perm of PERMISSIONS) {
    const created = await prisma.permission.upsert({
      where: { module_action_resource: { module: perm.module, action: perm.action, resource: perm.resource } },
      update: { description: perm.description },
      create: perm,
    });
    permMap[`${perm.module}.${perm.action}`] = created.id;
    process.stdout.write('.');
  }
  console.log(`\n✓ ${PERMISSIONS.length} permissions insérées`);

  // 2. Assigner les permissions par défaut à chaque rôle tenant
  const tenants = await prisma.tenant.findMany({
    where: { slug: { not: '__platform__' } },
    select: { id: true, name: true },
  });
  console.log(`\nAssignation pour ${tenants.length} tenant(s)...`);

  for (const tenant of tenants) {
    console.log(`\n  Tenant: ${tenant.name}`);

    for (const [roleSlug, permKeys] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      const role = await prisma.role.findFirst({
        where: { tenantId: tenant.id, slug: roleSlug },
      });
      if (!role) {
        console.log(`    — rôle "${roleSlug}" absent, ignoré`);
        continue;
      }

      // Ne pas écraser si déjà configuré manuellement
      const existing = await prisma.rolePermission.count({ where: { roleId: role.id } });
      if (existing > 0) {
        console.log(`    — "${roleSlug}" déjà configuré (${existing} permissions), ignoré`);
        continue;
      }

      const ids = permKeys.map((k) => permMap[k]).filter(Boolean);
      if (ids.length) {
        await prisma.rolePermission.createMany({
          data: ids.map((permissionId) => ({ roleId: role.id, permissionId })),
          skipDuplicates: true,
        });
        console.log(`    ✓ "${roleSlug}" → ${ids.length} permissions assignées`);
      }
    }
  }

  console.log('\nSeed permissions terminé.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
