-- Migration : Backfill du module 'reviews' pour les tenants existants
--
-- Le module 'reviews' (avis clients) a été ajouté le 2026-07-12
-- (migration 20260712125452_add_reviews). Cette migration créait la table
-- `reviews` et les colonnes d'agrégat sur `tenants`, mais n'attachait le
-- module à aucun tenant existant : l'activation d'un module se fait via une
-- ligne explicite dans `tenant_modules`, créée uniquement à l'inscription
-- (cf. tenants.service.ts, section "Activer les modules du plan").
--
-- Conséquence : tout tenant créé avant le 2026-07-12 n'a jamais reçu le
-- module 'reviews', même si son plan l'inclut désormais — GET /reviews
-- répond 403 (ModuleGuard) et le dashboard affichait silencieusement
-- "Aucun avis" au lieu d'une erreur (cf. useReviews qui ignorait `error`).
--
-- On rattache le module aux tenants dont le plan l'inclut réellement
-- (plans.features->>'reviews' = 'true'), à l'identique de la logique
-- appliquée à l'inscription.

INSERT INTO tenant_modules (id, tenant_id, module_id)
SELECT gen_random_uuid(), t.id, m.id
FROM tenants t
JOIN plans p ON p.id = t.plan_id
JOIN modules m ON m.slug = 'reviews' AND m.is_active = true
WHERE (p.features->>'reviews')::boolean IS TRUE
ON CONFLICT (tenant_id, module_id) DO NOTHING;
