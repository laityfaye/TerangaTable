-- Migration : Créer la ligne catalogue du module 'reviews' manquante en prod
--
-- La migration 20260903170000_backfill_reviews_module attachait le module
-- 'reviews' aux tenants dont le plan l'inclut, mais n'a rattaché personne :
-- la ligne du catalogue `modules` pour le slug 'reviews' n'a jamais existé
-- en production. Elle n'est créée que par `seed.ts` (upsert sur `slug`),
-- qui n'a été rejoué qu'en local/dev depuis l'ajout du module (2026-07-12) —
-- jamais contre la base de prod. Sans cette ligne, `ModuleGuard` ne peut
-- activer le module pour aucun tenant, quel que soit son plan.
--
-- On insère la ligne (mêmes valeurs que seed.ts), puis on rejoue le backfill
-- de tenant_modules — idempotent grâce à ON CONFLICT DO NOTHING, donc sans
-- risque de doublon avec la tentative précédente qui n'avait rien trouvé.

INSERT INTO modules (id, name, slug, description, icon, version, is_active, required_plan)
VALUES (
  gen_random_uuid(),
  'Avis clients',
  'reviews',
  'Collecte et modération des avis clients liés aux commandes',
  'Star',
  '1.0.0',
  true,
  'starter'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO tenant_modules (id, tenant_id, module_id)
SELECT gen_random_uuid(), t.id, m.id
FROM tenants t
JOIN plans p ON p.id = t.plan_id
JOIN modules m ON m.slug = 'reviews' AND m.is_active = true
WHERE (p.features->>'reviews')::boolean IS TRUE
ON CONFLICT (tenant_id, module_id) DO NOTHING;
