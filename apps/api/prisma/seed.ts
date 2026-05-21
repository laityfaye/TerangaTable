import { PrismaClient } from '@prisma/client';
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
        analytics: true,
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
      update: { ...plan, features: plan.features as never },
      create: { ...plan, features: plan.features as never },
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
    { name: 'Analytics', slug: 'analytics', icon: 'BarChart', requiredPlan: 'enterprise', description: 'Tableaux de bord et rapports avancés' },
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
  // The super-admin doesn't belong to any real tenant, but user_roles.tenant_id
  // is NOT NULL (part of the composite PK). We use a sentinel platform tenant.
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
