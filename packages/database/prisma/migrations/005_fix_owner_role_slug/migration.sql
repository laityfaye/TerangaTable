-- Migration 005 : Renommer le slug 'owner' → 'restaurant_owner' pour les rôles tenant-spécifiques
-- Les tenants créés via onboardTenant avaient slug='owner' au lieu de 'restaurant_owner'
UPDATE roles
SET slug = 'restaurant_owner'
WHERE slug = 'owner'
  AND tenant_id IS NOT NULL;
