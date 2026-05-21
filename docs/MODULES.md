# MODULES — Fonctionnalités et plans TÉRANGATABLE

---

## Plans d'abonnement (seed `plans`)

| Plan | Prix mensuel | Prix annuel | Max users | Max produits |
|---|---|---|---|---|
| **Starter** | 15 000 XOF | 150 000 XOF | 5 | 100 |
| **Growth** | 35 000 XOF | 350 000 XOF | 15 | 500 |
| **Enterprise** | 75 000 XOF | 750 000 XOF | 50 | illimité (-1) |

```ts
const plans = [
  {
    name: "Starter",
    price_monthly: 15000,
    price_yearly: 150000,
    max_users: 5,
    max_products: 100,
    features: { support: "email", api_access: false },
    is_active: true,
  },
  {
    name: "Growth",
    price_monthly: 35000,
    price_yearly: 350000,
    max_users: 15,
    max_products: 500,
    features: { support: "priority", api_access: true },
    is_active: true,
  },
  {
    name: "Enterprise",
    price_monthly: 75000,
    price_yearly: 750000,
    max_users: 50,
    max_products: -1,  // illimité
    features: { support: "dedicated", api_access: true, white_label: true },
    is_active: true,
  },
];
```

---

## Catalogue des modules (seed `modules`)

| Slug | Nom | Plan requis | Description |
|---|---|---|---|
| `pos` | Point of Sale | starter | Interface caisse tactile pour prise de commande sur place et emporté |
| `analytics` | Analytics Avancés | starter | Tableaux de bord revenus, produits, heures de pointe, performance staff |
| `website` | Site Vitrine | starter | Site public du restaurant avec menu en ligne, SEO, thèmes personnalisables |
| `kds` | Kitchen Display System | starter | Écran cuisine temps réel pour suivi des commandes en préparation |
| `reservations` | Réservations | growth | Gestion des réservations de tables avec plan de salle interactif |
| `delivery` | Livraison | growth | Zones de livraison, affectation livreurs, suivi en temps réel |
| `crm` | CRM Clients | growth | Base clients, segmentation, fidélité, historique achats |
| `custom_fields` | Champs Dynamiques | growth | Extension des entités (produits, commandes, clients) avec champs personnalisés |
| `workflows` | Workflows Configurables | growth | Personnalisation des cycles de vie des commandes et réservations |
| `rules_engine` | Moteur de Règles | enterprise | Automatisations événementielles (triggers, conditions, actions) |

```ts
const modules = [
  { name: "Point of Sale",           slug: "pos",           required_plan: "starter",    icon: "ShoppingCart",  version: "1.0.0" },
  { name: "Analytics Avancés",       slug: "analytics",     required_plan: "starter",    icon: "BarChart2",     version: "1.0.0" },
  { name: "Site Vitrine",            slug: "website",       required_plan: "starter",    icon: "Globe",         version: "1.0.0" },
  { name: "Kitchen Display System",  slug: "kds",           required_plan: "starter",    icon: "Monitor",       version: "1.0.0" },
  { name: "Réservations",            slug: "reservations",  required_plan: "growth",     icon: "Calendar",      version: "1.0.0" },
  { name: "Livraison",               slug: "delivery",      required_plan: "growth",     icon: "Truck",         version: "1.0.0" },
  { name: "CRM Clients",             slug: "crm",           required_plan: "growth",     icon: "Users",         version: "1.0.0" },
  { name: "Champs Dynamiques",       slug: "custom_fields", required_plan: "growth",     icon: "Sliders",       version: "1.0.0" },
  { name: "Workflows Configurables", slug: "workflows",     required_plan: "growth",     icon: "GitBranch",     version: "1.0.0" },
  { name: "Moteur de Règles",        slug: "rules_engine",  required_plan: "enterprise", icon: "Zap",           version: "1.0.0" },
];
```

---

## Workflows par défaut

Ces workflows sont créés automatiquement lors de l'onboarding d'un nouveau tenant via `TenantOnboardingService.createDefaultWorkflows(tenantId)`.

---

### Workflow "Sur place" (`entity_type: "order"`)

**États :**

| Nom | Slug | Couleur | initial | terminal | triggers_alert | sort_order |
|---|---|---|---|---|---|---|
| Nouvelle | `new` | `#F59E0B` | ✓ | — | — | 0 |
| En cuisine | `in_kitchen` | `#3B82F6` | — | — | — | 1 |
| Prête | `ready` | `#10B981` | — | — | ✓ | 2 |
| Servie | `served` | `#6B7280` | — | ✓ | — | 3 |
| Annulée | `cancelled` | `#EF4444` | — | ✓ | — | 4 |

**Transitions :**

| Nom | De | Vers | Rôles autorisés |
|---|---|---|---|
| Envoyer en cuisine | `new` | `in_kitchen` | serveur, caissier |
| Marquer prête | `in_kitchen` | `ready` | cuisinier |
| Marquer servie | `ready` | `served` | serveur |
| Annuler | `*` (null) | `cancelled` | manager |

---

### Workflow "Livraison" (`entity_type: "order"`)

**États :**

| Nom | Slug | Couleur | initial | terminal | triggers_alert | sort_order |
|---|---|---|---|---|---|---|
| Nouvelle | `new` | `#F59E0B` | ✓ | — | — | 0 |
| Confirmée | `confirmed` | `#8B5CF6` | — | — | — | 1 |
| En préparation | `in_preparation` | `#3B82F6` | — | — | — | 2 |
| En livraison | `in_delivery` | `#F97316` | — | — | ✓ | 3 |
| Livrée | `delivered` | `#10B981` | — | ✓ | — | 4 |
| Annulée | `cancelled` | `#EF4444` | — | ✓ | — | 5 |

**Transitions :**

| Nom | De | Vers | Rôles autorisés |
|---|---|---|---|
| Confirmer | `new` | `confirmed` | caissier, manager |
| Préparer | `confirmed` | `in_preparation` | cuisinier |
| Partir en livraison | `in_preparation` | `in_delivery` | livreur |
| Marquer livrée | `in_delivery` | `delivered` | livreur |
| Annuler | `*` (null) | `cancelled` | manager |

---

## TenantOnboardingService

Appelé automatiquement après la création d'un tenant (via `PATCH /v1/admin/requests/:id/approve`).

```ts
class TenantOnboardingService {
  async onboard(tenantId: string, plan: Plan): Promise<void> {
    await Promise.all([
      this.createDefaultWorkflows(tenantId),
      this.activateDefaultModules(tenantId, plan),
      this.createDefaultSettings(tenantId),
      this.createWebsiteSettings(tenantId),
    ]);
  }

  // Crée les workflows "Sur place" et "Livraison" décrits ci-dessus
  async createDefaultWorkflows(tenantId: string): Promise<void> { ... }

  // Active tous les modules compatibles avec le plan du tenant
  async activateDefaultModules(tenantId: string, plan: Plan): Promise<void> {
    const compatibleModules = await this.modulesRepo.findByMaxPlan(plan.name);
    // Insère dans tenant_modules avec is_active=true
  }

  // Settings initiaux (TVA 0%, devise depuis région, etc.)
  async createDefaultSettings(tenantId: string): Promise<void> { ... }

  // website_settings vide avec thème par défaut
  async createWebsiteSettings(tenantId: string): Promise<void> { ... }
}
```

---

## Vérification d'accès aux modules (guard `ModuleGuard`)

Chaque route nécessitant un module spécifique utilise `@RequiresModule('slug')`.

```ts
// Décorateur
@RequiresModule('delivery')

// Guard vérifie :
// 1. tenant_modules WHERE tenant_id = :tenantId AND module_id = (SELECT id FROM modules WHERE slug = 'delivery')
// 2. is_active = true
// 3. expires_at IS NULL OR expires_at > now()
// Si non satisfait → 403 { error: { code: "MODULE_INACTIVE", message: "Le module Livraison n'est pas activé sur votre compte." } }
```

---

## Compatibilité plan / module

La vérification est faite lors du toggle d'un module via `PATCH /v1/modules/:slug/toggle`.

```
Ordre des plans (hiérarchie) : starter < growth < enterprise

Un tenant peut activer un module si :
  planHierarchy[tenant.plan.name] >= planHierarchy[module.required_plan]
```

| Module | Starter | Growth | Enterprise |
|---|---|---|---|
| pos | ✓ | ✓ | ✓ |
| analytics | ✓ | ✓ | ✓ |
| website | ✓ | ✓ | ✓ |
| kds | ✓ | ✓ | ✓ |
| reservations | — | ✓ | ✓ |
| delivery | — | ✓ | ✓ |
| crm | — | ✓ | ✓ |
| custom_fields | — | ✓ | ✓ |
| workflows | — | ✓ | ✓ |
| rules_engine | — | — | ✓ |
