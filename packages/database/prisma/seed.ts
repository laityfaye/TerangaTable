import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Regions ──────────────────────────────────────────────────────────────
  const regionData = [
    {
      name: 'Dakar',
      slug: 'dakar',
      countryCode: 'SN',
      countryName: 'Sénégal',
      platformLabel: 'TérangaTable Dakar',
      timezone: 'Africa/Dakar',
      currencyCode: 'XOF',
      currencySymbol: 'F CFA',
      locale: 'fr-SN',
      isActive: true,
    },
    {
      name: 'Thiès',
      slug: 'thies',
      countryCode: 'SN',
      countryName: 'Sénégal',
      platformLabel: 'TérangaTable Thiès',
      timezone: 'Africa/Dakar',
      currencyCode: 'XOF',
      currencySymbol: 'F CFA',
      locale: 'fr-SN',
      isActive: true,
    },
    {
      name: 'Saint-Louis',
      slug: 'saint-louis',
      countryCode: 'SN',
      countryName: 'Sénégal',
      platformLabel: 'TérangaTable Saint-Louis',
      timezone: 'Africa/Dakar',
      currencyCode: 'XOF',
      currencySymbol: 'F CFA',
      locale: 'fr-SN',
      isActive: true,
    },
    {
      name: 'Ziguinchor',
      slug: 'ziguinchor',
      countryCode: 'SN',
      countryName: 'Sénégal',
      platformLabel: 'TérangaTable Ziguinchor',
      timezone: 'Africa/Dakar',
      currencyCode: 'XOF',
      currencySymbol: 'F CFA',
      locale: 'fr-SN',
      isActive: true,
    },
    {
      name: 'Abidjan',
      slug: 'abidjan',
      countryCode: 'CI',
      countryName: "Côte d'Ivoire",
      platformLabel: 'TérangaTable Abidjan',
      timezone: 'Africa/Abidjan',
      currencyCode: 'XOF',
      currencySymbol: 'F CFA',
      locale: 'fr-CI',
      isActive: true,
    },
    {
      name: 'Casablanca',
      slug: 'casablanca',
      countryCode: 'MA',
      countryName: 'Maroc',
      platformLabel: 'TérangaTable Casablanca',
      timezone: 'Africa/Casablanca',
      currencyCode: 'MAD',
      currencySymbol: 'DH',
      locale: 'fr-MA',
      isActive: true,
    },
    {
      name: 'Paris',
      slug: 'paris',
      countryCode: 'FR',
      countryName: 'France',
      platformLabel: 'TérangaTable Paris',
      timezone: 'Europe/Paris',
      currencyCode: 'EUR',
      currencySymbol: '€',
      locale: 'fr-FR',
      isActive: false,
    },
  ];

  for (const region of regionData) {
    await prisma.region.upsert({
      where: { slug: region.slug },
      update: region,
      create: region,
    });
  }
  console.log(`✅ ${regionData.length} régions insérées`);

  // ── Plans ─────────────────────────────────────────────────────────────────
  const plans = [
    {
      id: '00000000-0000-0000-0001-000000000001',
      name: 'Starter',
      priceMonthly: 15000,
      priceYearly: 150000,
      maxUsers: 3,
      maxProducts: 50,
      features: { pos: true, reservations: false, delivery: false, crm: false },
    },
    {
      id: '00000000-0000-0000-0001-000000000002',
      name: 'Growth',
      priceMonthly: 35000,
      priceYearly: 350000,
      maxUsers: 10,
      maxProducts: 200,
      features: { pos: true, reservations: true, delivery: true, crm: true },
    },
    {
      id: '00000000-0000-0000-0001-000000000003',
      name: 'Enterprise',
      priceMonthly: 75000,
      priceYearly: 750000,
      maxUsers: -1,
      maxProducts: -1,
      features: {
        pos: true,
        reservations: true,
        delivery: true,
        crm: true,
        analytics_pro: true,
        website: true,
        rules_engine: true,
        custom_fields: true,
        workflows: true,
        kds: true,
      },
    },
  ];

  const createdPlans: Record<string, string> = {};
  for (const plan of plans) {
    const created = await prisma.plan.upsert({
      where: { id: plan.id },
      update: { ...plan, features: plan.features as Prisma.InputJsonValue },
      create: { ...plan, features: plan.features as Prisma.InputJsonValue },
    });
    createdPlans[plan.name] = created.id;
  }
  console.log(`✅ ${plans.length} plans insérés`);

  // ── Modules ───────────────────────────────────────────────────────────────
  const modules = [
    { name: 'Point de vente', slug: 'pos', icon: 'ShoppingCart', requiredPlan: 'starter', description: 'Gestion des commandes et encaissements' },
    { name: 'Réservations', slug: 'reservations', icon: 'Calendar', requiredPlan: 'growth', description: 'Gestion des réservations de tables' },
    { name: 'Livraison', slug: 'delivery', icon: 'Truck', requiredPlan: 'growth', description: 'Gestion des livraisons et livreurs' },
    { name: 'CRM', slug: 'crm', icon: 'Users', requiredPlan: 'growth', description: 'Gestion des clients et fidélité' },
    { name: 'Analytics', slug: 'analytics_pro', icon: 'BarChart', requiredPlan: 'enterprise', description: 'Tableaux de bord et rapports avancés' },
    { name: 'Site vitrine', slug: 'website', icon: 'Globe', requiredPlan: 'enterprise', description: 'Site web public personnalisable' },
    { name: 'Moteur de règles', slug: 'rules_engine', icon: 'Zap', requiredPlan: 'enterprise', description: 'Automatisation des processus métier' },
    { name: 'Champs personnalisés', slug: 'custom_fields', icon: 'Settings', requiredPlan: 'enterprise', description: 'Extension des formulaires et données' },
    { name: 'Workflows', slug: 'workflows', icon: 'GitBranch', requiredPlan: 'enterprise', description: 'Cycles de vie personnalisés' },
    { name: 'Écran cuisine', slug: 'kds', icon: 'Monitor', requiredPlan: 'enterprise', description: 'Kitchen Display System' },
  ];

  for (const mod of modules) {
    await prisma.module.upsert({
      where: { slug: mod.slug },
      update: mod,
      create: mod,
    });
  }
  console.log(`✅ ${modules.length} modules insérés`);

  // ── Platform tenant (sentinel for super-admin role assignments) ───────────
  const PLATFORM_TENANT_ID = '00000000-0000-0000-0000-000000000000';
  const dakarRegion = await prisma.region.findUniqueOrThrow({ where: { slug: 'dakar' } });
  await prisma.tenant.upsert({
    where: { id: PLATFORM_TENANT_ID },
    update: {},
    create: {
      id: PLATFORM_TENANT_ID,
      slug: '__platform__',
      name: 'TérangaTable Platform',
      regionId: dakarRegion.id,
      planId: '00000000-0000-0000-0001-000000000003',
      status: 'active',
    },
  });

  // ── Super admin role ───────────────────────────────────────────────────────
  const superAdminRole = await prisma.role.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      tenantId: null,
      name: 'Super Admin',
      slug: 'super_admin',
      isSystem: true,
      description: 'Accès total à la plateforme',
    },
  });

  // ── System roles ───────────────────────────────────────────────────────────
  const systemRoles = [
    { id: '00000000-0000-0000-0002-000000000001', name: 'Admin Régional', slug: 'regional_admin',   isSystem: true },
    { id: '00000000-0000-0000-0002-000000000002', name: 'Propriétaire',   slug: 'restaurant_owner', isSystem: true },
    { id: '00000000-0000-0000-0002-000000000003', name: 'Manager',        slug: 'manager',          isSystem: true },
    { id: '00000000-0000-0000-0002-000000000004', name: 'Serveur',        slug: 'server',           isSystem: true },
    { id: '00000000-0000-0000-0002-000000000005', name: 'Caissier',       slug: 'cashier',          isSystem: true },
    { id: '00000000-0000-0000-0002-000000000006', name: 'Cuisine',        slug: 'kitchen_staff',    isSystem: true },
    { id: '00000000-0000-0000-0002-000000000007', name: 'Livreur',        slug: 'delivery_driver',  isSystem: true },
  ];

  for (const role of systemRoles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: {},
      create: { ...role, tenantId: null },
    });
  }
  console.log(`✅ ${systemRoles.length} rôles système insérés`);

  // ── Permissions ────────────────────────────────────────────────────────────
  const permissionDefs = [
    { module: 'orders',       action: 'view',          resource: 'Order',       description: 'Voir les commandes' },
    { module: 'orders',       action: 'create',        resource: 'Order',       description: 'Créer des commandes' },
    { module: 'orders',       action: 'transition',    resource: 'Order',       description: 'Changer le statut d\'une commande' },
    { module: 'orders',       action: 'delete',        resource: 'Order',       description: 'Supprimer des commandes' },
    { module: 'menu',         action: 'view',          resource: 'Menu',        description: 'Voir le menu' },
    { module: 'menu',         action: 'edit',          resource: 'Menu',        description: 'Modifier le menu' },
    { module: 'menu',         action: 'delete',        resource: 'Menu',        description: 'Supprimer des éléments du menu' },
    { module: 'pos',          action: 'access',        resource: 'Pos',         description: 'Accéder au point de vente' },
    { module: 'pos',          action: 'session_open',  resource: 'Pos',         description: 'Ouvrir une session caisse' },
    { module: 'pos',          action: 'session_close', resource: 'Pos',         description: 'Fermer une session caisse' },
    { module: 'reservations', action: 'view',          resource: 'Reservation', description: 'Voir les réservations' },
    { module: 'reservations', action: 'manage',        resource: 'Reservation', description: 'Gérer les réservations' },
    { module: 'analytics',    action: 'view',          resource: 'Analytics',   description: 'Voir les analyses' },
    { module: 'customers',    action: 'view',          resource: 'Customer',    description: 'Voir les clients' },
    { module: 'customers',    action: 'edit',          resource: 'Customer',    description: 'Modifier les clients' },
    { module: 'settings',     action: 'view',          resource: 'Settings',    description: 'Voir les paramètres' },
    { module: 'settings',     action: 'edit',          resource: 'Settings',    description: 'Modifier les paramètres' },
    { module: 'delivery',     action: 'view',          resource: 'Delivery',    description: 'Voir les livraisons' },
    { module: 'delivery',     action: 'manage',        resource: 'Delivery',    description: 'Gérer les livraisons' },
  ];

  const permissionMap: Record<string, string> = {};
  for (const p of permissionDefs) {
    const perm = await prisma.permission.upsert({
      where: { module_action_resource: { module: p.module, action: p.action, resource: p.resource } },
      update: { description: p.description },
      create: p,
    });
    permissionMap[`${p.module}.${p.action}`] = perm.id;
  }
  console.log(`✅ ${permissionDefs.length} permissions insérées`);

  // ── Assignation permissions → rôles système ───────────────────────────────
  const allPerms = Object.values(permissionMap);
  const ownerPerms = allPerms;
  const managerPerms = allPerms.filter((id) => {
    const key = Object.entries(permissionMap).find(([, v]) => v === id)?.[0];
    return key !== 'settings.edit';
  });
  const pick = (...keys: string[]) => keys.map((k) => permissionMap[k]).filter((id): id is string => !!id);

  const serverPerms  = pick('orders.view', 'orders.create', 'orders.transition', 'reservations.view', 'reservations.manage', 'menu.view');
  const cashierPerms = pick('pos.access', 'pos.session_open', 'pos.session_close', 'orders.view', 'orders.create');
  const kitchenPerms = pick('orders.view', 'orders.transition');
  const deliveryPerms = pick('delivery.view', 'delivery.manage', 'orders.view');

  const rolePermAssignments: Array<{ roleId: string; permIds: string[] }> = [
    { roleId: '00000000-0000-0000-0002-000000000002', permIds: ownerPerms },
    { roleId: '00000000-0000-0000-0002-000000000003', permIds: managerPerms },
    { roleId: '00000000-0000-0000-0002-000000000004', permIds: serverPerms },
    { roleId: '00000000-0000-0000-0002-000000000005', permIds: cashierPerms },
    { roleId: '00000000-0000-0000-0002-000000000006', permIds: kitchenPerms },
    { roleId: '00000000-0000-0000-0002-000000000007', permIds: deliveryPerms },
  ];

  for (const { roleId, permIds } of rolePermAssignments) {
    for (const permissionId of permIds.filter(Boolean)) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      });
    }
  }
  console.log('✅ Permissions assignées aux rôles système');

  // ── Super admin user ───────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Admin2026!', 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@terangatable.com' },
    update: {},
    create: {
      tenantId: null,
      email: 'admin@terangatable.com',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      isActive: true,
    },
  });

  await prisma.$executeRaw`
    INSERT INTO user_roles (user_id, role_id, tenant_id)
    VALUES (${superAdmin.id}::uuid, ${superAdminRole.id}::uuid, ${PLATFORM_TENANT_ID}::uuid)
    ON CONFLICT DO NOTHING
  `;

  console.log(`✅ Super admin créé : ${superAdmin.email}`);

  console.log('\n🎉 Seed terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
