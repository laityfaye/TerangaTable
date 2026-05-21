import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$executeRaw`
    UPDATE roles
    SET slug = 'restaurant_owner'
    WHERE slug = 'owner'
      AND tenant_id IS NOT NULL
  `;
  console.log(`✅ ${result} rôle(s) mis à jour : 'owner' → 'restaurant_owner'`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
