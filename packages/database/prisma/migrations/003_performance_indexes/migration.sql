-- Migration 003: index de performance pour les requêtes multi-tenant
-- Applique : pnpm prisma migrate dev --name performance_indexes

-- (tenant_id, is_available) sur products
-- Optimise les requêtes "quels produits disponibles pour ce tenant ?"
CREATE INDEX IF NOT EXISTS "products_tenant_id_is_available_idx"
  ON "products" ("tenant_id", "is_available");

-- (tenant_id, created_at) sur reservations
-- Optimise les requêtes d'historique et de reporting par date
CREATE INDEX IF NOT EXISTS "reservations_tenant_id_created_at_idx"
  ON "reservations" ("tenant_id", "created_at");
