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

  // ── Tenants de démonstration ───────────────────────────────────────────────
  const staffHash   = await bcrypt.hash('Staff2026!', 12);
  const adminHash   = await bcrypt.hash('Admin2026!', 12);

  const thiesRegion = await prisma.region.findUniqueOrThrow({ where: { slug: 'thies' } });

  const GROWTH_PLAN_ID  = '00000000-0000-0000-0001-000000000002';
  const STARTER_PLAN_ID = '00000000-0000-0000-0001-000000000001';

  const OWNER_ROLE_ID   = '00000000-0000-0000-0002-000000000002'; // restaurant_owner
  const MANAGER_ROLE_ID = '00000000-0000-0000-0002-000000000003'; // manager
  const SERVER_ROLE_ID  = '00000000-0000-0000-0002-000000000004'; // server
  const CASHIER_ROLE_ID = '00000000-0000-0000-0002-000000000005'; // cashier

  // ── Tenant 1 : Le Téranga (Dakar, Growth) ─────────────────────────────────
  const TERANGA_ID = '11111111-0000-0000-0000-000000000001';

  const teranga = await prisma.tenant.upsert({
    where: { id: TERANGA_ID },
    update: {},
    create: {
      id: TERANGA_ID,
      slug: 'le-teranga-dakar',
      name: 'Le Téranga',
      regionId: dakarRegion.id,
      planId: GROWTH_PLAN_ID,
      status: 'active',
    },
  });

  const terangaUsers = [
    { email: 'proprietaire.teranga@terangatable.com', firstName: 'Amadou',  lastName: 'Diallo',  roleId: OWNER_ROLE_ID,   hash: adminHash },
    { email: 'manager.teranga@terangatable.com',      firstName: 'Fatou',   lastName: 'Ndiaye',  roleId: MANAGER_ROLE_ID, hash: staffHash },
    { email: 'serveur.teranga@terangatable.com',      firstName: 'Moussa',  lastName: 'Sarr',    roleId: SERVER_ROLE_ID,  hash: staffHash },
    { email: 'caissier.teranga@terangatable.com',     firstName: 'Aissatou',lastName: 'Diop',    roleId: CASHIER_ROLE_ID, hash: staffHash },
  ];

  for (const u of terangaUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        tenantId: teranga.id,
        email: u.email,
        passwordHash: u.hash,
        firstName: u.firstName,
        lastName: u.lastName,
        isActive: true,
      },
    });
    await prisma.$executeRaw`
      INSERT INTO user_roles (user_id, role_id, tenant_id)
      VALUES (${user.id}::uuid, ${u.roleId}::uuid, ${teranga.id}::uuid)
      ON CONFLICT DO NOTHING
    `;
  }
  console.log(`✅ Tenant "Le Téranga" (Dakar) créé avec ${terangaUsers.length} utilisateurs`);

  // ── Tenant 2 : Thiossane (Thiès, Starter) ─────────────────────────────────
  const THIOSSANE_ID = '22222222-0000-0000-0000-000000000001';

  const thiossane = await prisma.tenant.upsert({
    where: { id: THIOSSANE_ID },
    update: {},
    create: {
      id: THIOSSANE_ID,
      slug: 'thiossane-thies',
      name: 'Thiossane',
      regionId: thiesRegion.id,
      planId: STARTER_PLAN_ID,
      status: 'active',
    },
  });

  const thiossaneUsers = [
    { email: 'proprietaire.thiossane@terangatable.com', firstName: 'Ousmane', lastName: 'Faye',   roleId: OWNER_ROLE_ID,   hash: adminHash },
    { email: 'serveur.thiossane@terangatable.com',      firstName: 'Mariama', lastName: 'Baldé',  roleId: SERVER_ROLE_ID,  hash: staffHash },
    { email: 'caissier.thiossane@terangatable.com',     firstName: 'Ibrahima',lastName: 'Camara', roleId: CASHIER_ROLE_ID, hash: staffHash },
  ];

  for (const u of thiossaneUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        tenantId: thiossane.id,
        email: u.email,
        passwordHash: u.hash,
        firstName: u.firstName,
        lastName: u.lastName,
        isActive: true,
      },
    });
    await prisma.$executeRaw`
      INSERT INTO user_roles (user_id, role_id, tenant_id)
      VALUES (${user.id}::uuid, ${u.roleId}::uuid, ${thiossane.id}::uuid)
      ON CONFLICT DO NOTHING
    `;
  }
  console.log(`✅ Tenant "Thiossane" (Thiès) créé avec ${thiossaneUsers.length} utilisateurs`);

  // ── Clients de démonstration (Le Téranga) ──────────────────────────────────
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  const demoCustomers = [
    // VIP (top dépensier)
    { firstName: 'Cheikh', lastName: 'Mbaye',    email: 'cheikh.mbaye@demo.com',    phone: '+221771000001', totalOrders: 24, totalSpent: 485000, loyaltyPoints: 485, lastVisitAt: daysAgo(3),  createdAt: daysAgo(180) },
    { firstName: 'Rokhaya', lastName: 'Sall',    email: 'rokhaya.sall@demo.com',    phone: '+221772000002', totalOrders: 18, totalSpent: 362000, loyaltyPoints: 362, lastVisitAt: daysAgo(7),  createdAt: daysAgo(150) },
    // Régulier (>= 3 commandes, dernière visite < 60j)
    { firstName: 'Ibou', lastName: 'Diagne',     email: 'ibou.diagne@demo.com',     phone: '+221773000003', totalOrders: 7,  totalSpent: 95000,  loyaltyPoints: 95,  lastVisitAt: daysAgo(15), createdAt: daysAgo(90)  },
    { firstName: 'Ndéye', lastName: 'Fall',      email: 'ndeye.fall@demo.com',      phone: '+221774000004', totalOrders: 5,  totalSpent: 67500,  loyaltyPoints: 67,  lastVisitAt: daysAgo(30), createdAt: daysAgo(120) },
    { firstName: 'Pape', lastName: 'Gueye',      email: 'pape.gueye@demo.com',      phone: '+221775000005', totalOrders: 4,  totalSpent: 48000,  loyaltyPoints: 48,  lastVisitAt: daysAgo(45), createdAt: daysAgo(200) },
    // Nouveau (< 30j, 1 commande)
    { firstName: 'Aïssatou', lastName: 'Bah',   email: 'aissatou.bah@demo.com',    phone: '+221776000006', totalOrders: 1,  totalSpent: 12500,  loyaltyPoints: 12,  lastVisitAt: daysAgo(5),  createdAt: daysAgo(5)   },
    { firstName: 'Mamadou', lastName: 'Kouyaté', email: 'mamadou.kouyate@demo.com', phone: '+221777000007', totalOrders: 1,  totalSpent: 8700,   loyaltyPoints: 8,   lastVisitAt: daysAgo(2),  createdAt: daysAgo(2)   },
    // Inactif (dernière visite > 60j)
    { firstName: 'Fatimata', lastName: 'Cissé', email: 'fatimata.cisse@demo.com',  phone: '+221778000008', totalOrders: 3,  totalSpent: 31000,  loyaltyPoints: 31,  lastVisitAt: daysAgo(75), createdAt: daysAgo(300) },
    { firstName: 'Omar', lastName: 'Touré',      email: 'omar.toure@demo.com',      phone: '+221779000009', totalOrders: 2,  totalSpent: 18500,  loyaltyPoints: 18,  lastVisitAt: daysAgo(90), createdAt: daysAgo(200) },
    // Sans email
    { firstName: 'Adja', lastName: 'Ndiaye',     email: null,                        phone: '+221770000010', totalOrders: 6,  totalSpent: 72000,  loyaltyPoints: 72,  lastVisitAt: daysAgo(20), createdAt: daysAgo(100) },
  ];

  for (const c of demoCustomers) {
    await prisma.customer.upsert({
      where: { id: '00000000-0000-0000-0003-' + String(demoCustomers.indexOf(c) + 1).padStart(12, '0') },
      update: {},
      create: {
        id: '00000000-0000-0000-0003-' + String(demoCustomers.indexOf(c) + 1).padStart(12, '0'),
        tenantId: TERANGA_ID,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        totalOrders: c.totalOrders,
        totalSpent: c.totalSpent.toString(),
        loyaltyPoints: c.loyaltyPoints,
        lastVisitAt: c.lastVisitAt,
        createdAt: c.createdAt,
      },
    });
  }
  console.log(`✅ ${demoCustomers.length} clients de démonstration insérés (Le Téranga)`);

  // ── Config fidélité par défaut (Le Téranga) ───────────────────────────────
  await prisma.setting.upsert({
    where: { tenantId_key: { tenantId: TERANGA_ID, key: 'loyalty_config' } },
    update: {},
    create: {
      tenantId: TERANGA_ID,
      key: 'loyalty_config',
      value: {
        enabled: true,
        points_per_amount: 1000,
        redemption_points: 100,
        redemption_value: 500,
        expiry_days: 0,
        vip_threshold_type: 'percent',
        vip_threshold_value: 10,
        rewards: [
          { points_required: 100, description: 'Thé offert', type: 'gift' },
          { points_required: 300, description: '500 F de réduction', type: 'discount' },
          { points_required: 1000, description: 'Repas offert', type: 'upgrade' },
        ],
      } as Prisma.InputJsonValue,
      type: 'json',
      category: 'loyalty',
    },
  });
  console.log('✅ Configuration fidélité insérée (Le Téranga)');

  console.log('\n🎉 Seed terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
