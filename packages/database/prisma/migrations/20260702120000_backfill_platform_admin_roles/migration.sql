-- Migration : Backfill des rôles plateforme dans user_roles
--
-- Avant cette migration, le rôle super_admin/regional_admin d'un compte plateforme
-- (users.tenant_id IS NULL) était déduit dynamiquement dans le code applicatif à partir
-- de la relation regions.admin_id, avec un repli implicite vers super_admin pour tout
-- compte plateforme non assigné à une région. C'était la cause d'une élévation de
-- privilèges : un admin régional désassigné de sa région (ex. PATCH /regions/:id/assign-admin
-- avec userId=null) devenait automatiquement super_admin dès son prochain login/refresh.
--
-- Le rôle est désormais lu exclusivement depuis user_roles (cf. auth.service.ts extractRoles).
-- Cette migration réattribue le rôle 'regional_admin' aux comptes dont l'état est connu
-- avec certitude (ils administrent effectivement une région aujourd'hui). Elle n'attribue
-- PAS 'super_admin' automatiquement : ce rôle doit être ré-accordé manuellement au besoin
-- (principe du moindre privilège), car aucune donnée fiable ne permet de distinguer un
-- super_admin légitime d'un compte ayant profité de la faille.

INSERT INTO user_roles (user_id, role_id, tenant_id)
SELECT r.admin_id, role_ra.id, t.id
FROM regions r
JOIN roles role_ra ON role_ra.slug = 'regional_admin' AND role_ra.tenant_id IS NULL
JOIN tenants t ON t.slug = '__platform__'
WHERE r.admin_id IS NOT NULL
ON CONFLICT DO NOTHING;
