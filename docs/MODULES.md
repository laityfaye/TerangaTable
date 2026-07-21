# MODULES — Fonctionnalités et plans TÉRANGATABLE

---

## Plans d'abonnement (seed `plans`)

> Gestion via `apps/api/src/modules/plans/` (CRUD super-admin) et `super-admin/plans` (UI). Aucune facturation réelle n'est intégrée à ce jour (pas de Stripe/mobile money) — un changement de plan est une action déclarative du super-admin, pas un paiement.

| Plan | Prix mensuel | Prix annuel | Max users | Max produits |
|---|---|---|---|---|
| **Starter** | 15 000 XOF | 150 000 XOF | 3 | 50 |
| **Growth** | 35 000 XOF | 350 000 XOF | 10 | 200 |
| **Enterprise** | 75 000 XOF | 750 000 XOF | illimité (-1) | illimité (-1) |

`Plan.features` (JSON) liste les slugs de modules inclus dans le plan — c'est la source de vérité réelle pour l'activation (voir note ci-dessous) :

```ts
const plans = [
  {
    name: "Starter",
    priceMonthly: 15000,
    priceYearly: 150000,
    maxUsers: 3,
    maxProducts: 50,
    features: { pos: true, reservations: false, delivery: false, crm: false, reviews: true },
  },
  {
    name: "Growth",
    priceMonthly: 35000,
    priceYearly: 350000,
    maxUsers: 10,
    maxProducts: 200,
    features: { pos: true, reservations: true, delivery: true, crm: true, whatsapp: true, reviews: true },
  },
  {
    name: "Enterprise",
    priceMonthly: 75000,
    priceYearly: 750000,
    maxUsers: -1,
    maxProducts: -1,
    features: {
      pos: true, reservations: true, delivery: true, crm: true,
      analytics: true, website: true, rules_engine: true,
      custom_fields: true, workflows: true, kds: true,
      whatsapp: true, reviews: true,
    },
  },
];
```

---

## Catalogue des modules (seed `modules`)

> **Note :** `Module.requiredPlan` ci-dessous est un champ **informatif** (affiché dans l'UI super-admin), il ne pilote pas l'activation réelle. La source de vérité pour "quel module est inclus dans quel plan" est `Plan.features` (map JSON par plan, voir section suivante) — c'est elle que lisent `TenantsService.updatePlan()` et l'onboarding pour créer/retirer les `TenantModule`. Les deux doivent rester cohérents manuellement à chaque ajout de module.

| Slug | Nom | Plan requis (informatif) | Description |
|---|---|---|---|
| `pos` | Point de vente | starter | Interface caisse tactile pour prise de commande sur place et emporté |
| `reservations` | Réservations | growth | Gestion des réservations de tables |
| `delivery` | Livraison | growth | Zones de livraison, affectation livreurs, suivi GPS en temps réel |
| `crm` | CRM Clients | growth | Base clients, segmentation, fidélité, historique achats |
| `whatsapp` | Assistant WhatsApp | growth | Prise de commande conversationnelle via WhatsApp (Twilio + Claude) — numéro partagé plateforme, restaurant identifié en conversation |
| `reviews` | Avis clients | starter | Collecte et modération des avis clients liés à la commande |
| `analytics` | Analytics Avancés | enterprise | Tableaux de bord revenus, produits, heures de pointe, performance staff |
| `website` | Site Vitrine | enterprise | Site public du restaurant avec menu en ligne, SEO, thèmes personnalisables |
| `kds` | Kitchen Display System | enterprise | Écran cuisine temps réel pour suivi des commandes en préparation |
| `custom_fields` | Champs Dynamiques | enterprise | Extension des entités (produits, commandes, clients) avec champs personnalisés |
| `workflows` | Workflows Configurables | enterprise | Personnalisation des cycles de vie des commandes et réservations |
| `rules_engine` | Moteur de Règles | enterprise | Automatisations événementielles (triggers, conditions, actions) |

```ts
const modules = [
  { name: "Point de vente",          slug: "pos",           requiredPlan: "starter",     icon: "ShoppingCart",  description: "Gestion des commandes et encaissements" },
  { name: "Réservations",            slug: "reservations",  requiredPlan: "growth",      icon: "Calendar",      description: "Gestion des réservations de tables" },
  { name: "Livraison",               slug: "delivery",      requiredPlan: "growth",      icon: "Truck",         description: "Gestion des livraisons et livreurs" },
  { name: "CRM",                     slug: "crm",           requiredPlan: "growth",      icon: "Users",         description: "Gestion des clients et fidélité" },
  { name: "Assistant WhatsApp",      slug: "whatsapp",      requiredPlan: "growth",      icon: "MessageCircle", description: "Prise de commande automatisée via WhatsApp, propulsée par IA" },
  { name: "Avis clients",            slug: "reviews",       requiredPlan: "starter",     icon: "Star",          description: "Collecte et modération des avis clients liés aux commandes" },
  { name: "Analytics",               slug: "analytics",     requiredPlan: "enterprise",  icon: "BarChart",      description: "Tableaux de bord et rapports avancés" },
  { name: "Site vitrine",            slug: "website",       requiredPlan: "enterprise",  icon: "Globe",         description: "Site web public personnalisable" },
  { name: "Écran cuisine",           slug: "kds",           requiredPlan: "enterprise",  icon: "Monitor",       description: "Kitchen Display System" },
  { name: "Champs personnalisés",    slug: "custom_fields", requiredPlan: "enterprise",  icon: "Settings",      description: "Extension des formulaires et données" },
  { name: "Workflows",               slug: "workflows",     requiredPlan: "enterprise",  icon: "GitBranch",     description: "Cycles de vie personnalisés" },
  { name: "Moteur de règles",        slug: "rules_engine",  requiredPlan: "enterprise",  icon: "Zap",           description: "Automatisation des processus métier" },
];
```

**Historique :** `analytics` était seedé sous le slug `analytics_pro` alors que le contrôleur vérifie `@RequireModule('analytics')` — aucun tenant ne pouvait jamais l'activer. Corrigé le 2026-07-21. `website`/`kds`/`custom_fields`/`workflows` sont enterprise-only dans le seed réel (`packages/database/prisma/seed.ts`), plus restrictif que la répartition par tiers historiquement documentée ici — cette page a été mise à jour pour refléter l'état réel du produit plutôt que l'inverse, une bascule de tiers vers le bas étant une décision commerciale hors du scope d'un correctif de cohérence technique.

---

## Workflows par défaut

Créés automatiquement à l'onboarding par `TenantsService.createDefaultWorkflows(tenantId, tx)` (méthode privée de `apps/api/src/modules/tenants/tenants.service.ts`, appelée depuis `approveRequest()`).

> **Choix assumé (2026-07-03) :** un seul `WorkflowDefinition` `entity_type: "order"` regroupe les deux cycles "sur place" et "livraison" au lieu de deux workflows distincts, pour éviter d'avoir à faire porter à `orders.service.ts`/`WorkflowEngine` la logique de sélection du bon workflow selon le type de commande à la création. Décision délibérée, pas un gap à combler — voir commentaire dans le code.

---

### Workflow "Cycle de vie commande" (`entity_type: "order"`, unique, fusionne sur-place + livraison)

**États :**

| Nom | Slug | Couleur | initial | terminal | triggers_alert | sort_order |
|---|---|---|---|---|---|---|
| Nouvelle | `new` | `#F59E0B` | ✓ | — | — | 0 |
| Confirmée | `confirmed` | `#8B5CF6` | — | — | — | 1 |
| En cuisine | `in_kitchen` | `#3B82F6` | — | — | — | 2 |
| En préparation | `in_preparation` | `#3B82F6` | — | — | — | 3 |
| Prête | `ready` | `#10B981` | — | — | ✓ | 4 |
| En livraison | `in_delivery` | `#F97316` | — | — | ✓ | 5 |
| Servie | `served` | `#6B7280` | — | ✓ | — | 6 |
| Livrée | `delivered` | `#10B981` | — | ✓ | — | 7 |
| Annulée | `cancelled` | `#EF4444` | — | ✓ | — | 8 |

**Transitions :**

| Nom | De | Vers | Rôles autorisés |
|---|---|---|---|
| Envoyer en cuisine | `new` | `in_kitchen` | serveur, caissier |
| Marquer prête | `in_kitchen` | `ready` | cuisinier |
| Marquer servie | `ready` | `served` | serveur |
| Confirmer | `new` | `confirmed` | caissier, manager |
| Préparer | `confirmed` | `in_preparation` | cuisinier |
| Partir en livraison | `in_preparation` | `in_delivery` | livreur |
| Marquer livrée | `in_delivery` | `delivered` | livreur |
| Annuler | `*` (null) | `cancelled` | manager, restaurant_owner |

### Workflow "Cycle de vie réservation" (`entity_type: "reservation"`)

**États :** En attente (`pending`, initial) → Confirmée (`confirmed`) → Installée (`seated`) → Terminée (`completed`, terminal) ; Annulée (`cancelled`, terminal) depuis n'importe quel état.

---

## Onboarding d'un tenant

Effectué dans `TenantsService.approveRequest()` (`apps/api/src/modules/tenants/tenants.service.ts`), appelé via `PATCH /v1/admin/requests/:id/approve`. Dans une transaction Prisma :
1. Création du tenant + de l'utilisateur owner + des rôles par défaut (`restaurant_owner`, `manager`, `serveur`, `caissier`, `cuisinier`, `livreur`).
2. Activation des modules inclus dans `plan.features` (voir plus haut) via `TenantModule.createMany`.
3. `websiteSettings` par défaut + settings généraux (nom, téléphone, ville, pays) repris de la demande.
4. `createDefaultWorkflows()` (ci-dessus).
5. Email avec identifiants temporaires envoyé à l'owner.

Un changement de plan ultérieur (`TenantsService.updatePlan()`, `PATCH /v1/admin/tenants/:id/plan`) resynchronise `TenantModule` sur `plan.features` du nouveau plan (ajoute les modules inclus, retire les autres) — pas de conservation manuelle d'activations individuelles hors plan.

---

## Vérification d'accès aux modules (guard `ModuleGuard`)

Chaque route nécessitant un module spécifique utilise `@RequireModule('slug')` (`apps/api/src/common/decorators/require-permission.decorator.ts` + guard associé).

```ts
// Décorateur
@RequireModule('delivery')

// Guard vérifie :
// 1. tenant_modules WHERE tenant_id = :tenantId AND module_id = (SELECT id FROM modules WHERE slug = 'delivery')
// 2. is_active = true
// Si non satisfait → 403
```

Modules gatés en pratique (contrôleur → décorateur vérifié) : `pos`, `analytics`, `website` (dashboard uniquement, pas le site public), `reservations`, `delivery`, `crm` (customers + loyalty), `custom_fields`, `workflows`, `rules_engine`, `reviews`. **Non gaté à ce jour :** `kds` (pas de contrôleur dédié — voir ci-dessous), `whatsapp` (aucun `@RequireModule` dans `apps/api/src/modules/whatsapp/`, le contrôle de plan n'est pas appliqué en pratique côté backend).

`ZonesController`/`TablesController` (réservations) sont volontairement **non gatés** — partagés avec POS, utilisés par tous les plans.

---

## Compatibilité plan / module

**Il n'existe pas de toggle self-service par tenant avec vérification de hiérarchie.** L'activation se fait uniquement via (a) l'onboarding initial ou (b) `updatePlan()` côté super-admin, tous deux pilotés par `Plan.features` — pas par une comparaison `module.required_plan` vs plan du tenant. Le tableau ci-dessous reflète `Plan.features` du seed réel (`packages/database/prisma/seed.ts`) :

| Module | Starter | Growth | Enterprise |
|---|---|---|---|
| pos | ✓ | ✓ | ✓ |
| reviews | ✓ | ✓ | ✓ |
| reservations | — | ✓ | ✓ |
| delivery | — | ✓ | ✓ |
| crm | — | ✓ | ✓ |
| whatsapp | — | ✓ | ✓ |
| analytics | — | — | ✓ |
| website | — | — | ✓ |
| kds | — | — | ✓ |
| custom_fields | — | — | ✓ |
| workflows | — | — | ✓ |
| rules_engine | — | — | ✓ |
