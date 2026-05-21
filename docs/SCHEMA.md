# SCHEMA — Base de données PostgreSQL TÉRANGATABLE

Toutes les tables utilisent UUID comme clé primaire (gen_random_uuid()).
Toutes les tables métier (tenant-scoped) ont une politique RLS activée.
Conventions : `created_at TIMESTAMPTZ DEFAULT now()`, `updated_at TIMESTAMPTZ DEFAULT now()` (déclenché via trigger).

---

## DOMAINE SYSTÈME

### `regions`

Représente une zone géographique couverte par la plateforme. Chaque région a son propre administrateur régional.

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK, DEFAULT gen_random_uuid() |
| name | VARCHAR(100) | NOT NULL |
| slug | VARCHAR(50) | UNIQUE, NOT NULL |
| country_code | VARCHAR(2) | NOT NULL |
| country_name | VARCHAR(100) | NOT NULL |
| platform_label | VARCHAR(150) | NOT NULL |
| timezone | VARCHAR(50) | NOT NULL |
| currency_code | VARCHAR(3) | NOT NULL |
| currency_symbol | VARCHAR(10) | NOT NULL |
| locale | VARCHAR(10) | NOT NULL |
| admin_id | UUID | FK → users(id) ON DELETE SET NULL, NULL |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMPTZ | DEFAULT now() |

**Index :** `(slug)`, `(country_code)`, `(is_active)`
**RLS :** Lecture publique pour les régions actives. Écriture réservée aux super_admins.

---

### `tenants`

Restaurant / établissement client de la plateforme. Isolé par region_id et identifié par slug (sous-domaine).

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| region_id | UUID | FK → regions(id) NOT NULL |
| slug | VARCHAR(63) | UNIQUE, NOT NULL |
| name | VARCHAR(255) | NOT NULL |
| status | ENUM | `active \| suspended \| trial \| deleted`, DEFAULT 'trial' |
| plan_id | UUID | FK → plans(id) NOT NULL |
| settings | JSONB | DEFAULT '{}' |
| trial_ends_at | TIMESTAMPTZ | NULL |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | DEFAULT now() |

**Index :** `(slug)`, `(region_id, status)`, `(status)`
**RLS :** Super admin = accès total. Tenant users = uniquement leur propre tenant.

---

### `tenant_requests`

Demandes d'inscription de nouveaux restaurants. Traitées par les super admins ou admins régionaux.

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| region_id | UUID | FK → regions(id) NOT NULL |
| owner_name | VARCHAR(255) | NOT NULL |
| owner_email | VARCHAR(255) | NOT NULL |
| restaurant_name | VARCHAR(255) | NOT NULL |
| phone | VARCHAR(30) | NULL |
| city | VARCHAR(100) | NULL |
| message | TEXT | NULL |
| status | ENUM | `pending \| approved \| rejected`, DEFAULT 'pending' |
| reviewed_by | UUID | FK → users(id) ON DELETE SET NULL, NULL |
| reviewed_at | TIMESTAMPTZ | NULL |
| created_at | TIMESTAMPTZ | DEFAULT now() |

**Index :** `(status)`, `(region_id, status)`, `(owner_email)`
**RLS :** Lecture/écriture super_admin et regional_admin de la région concernée.

---

### `plans`

Formules d'abonnement proposées aux tenants.

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR(100) | NOT NULL |
| price_monthly | DECIMAL(10,2) | NOT NULL |
| price_yearly | DECIMAL(10,2) | NOT NULL |
| max_users | INT | NOT NULL |
| max_products | INT | NOT NULL |
| features | JSONB | DEFAULT '{}' |
| is_active | BOOLEAN | DEFAULT true |

**Index :** `(is_active)`
**RLS :** Lecture publique. Écriture super_admin uniquement.

---

## DOMAINE IDENTITÉ

### `users`

Utilisateurs de la plateforme. tenant_id NULL = super admin ou admin régional.

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants(id) ON DELETE CASCADE, NULL |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| first_name | VARCHAR(100) | NOT NULL |
| last_name | VARCHAR(100) | NOT NULL |
| phone | VARCHAR(30) | NULL |
| avatar_url | TEXT | NULL |
| is_active | BOOLEAN | DEFAULT true |
| last_login_at | TIMESTAMPTZ | NULL |
| created_at | TIMESTAMPTZ | DEFAULT now() |

**Index :** `(email)`, `(tenant_id, is_active)`, `(tenant_id)`
**RLS :** Chaque utilisateur voit uniquement les users de son tenant. Super admin = accès total.

---

### `roles`

Rôles assignables aux utilisateurs. is_system=true = rôles prédéfinis non supprimables (super_admin, regional_admin, manager, serveur, caissier, cuisinier, livreur).

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants(id) ON DELETE CASCADE, NULL |
| name | VARCHAR(100) | NOT NULL |
| slug | VARCHAR(100) | NOT NULL |
| description | TEXT | NULL |
| is_system | BOOLEAN | DEFAULT false |
| created_at | TIMESTAMPTZ | DEFAULT now() |

**Contrainte :** UNIQUE(tenant_id, slug)
**Index :** `(tenant_id, slug)`, `(is_system)`
**RLS :** Scoped par tenant_id.

---

### `permissions`

Catalogue exhaustif des permissions (pas de tenant_id — global).

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| module | VARCHAR(50) | NOT NULL |
| action | VARCHAR(50) | NOT NULL |
| resource | VARCHAR(100) | NOT NULL |
| description | TEXT | NULL |

**Contrainte :** UNIQUE(module, action, resource)
**Index :** `(module)`, `(module, action)`

---

### `user_roles`

Table de jonction many-to-many users ↔ roles, scoped par tenant.

| Colonne | Type | Contraintes |
|---|---|---|
| user_id | UUID | FK → users(id) ON DELETE CASCADE |
| role_id | UUID | FK → roles(id) ON DELETE CASCADE |
| tenant_id | UUID | FK → tenants(id) ON DELETE CASCADE |
| granted_at | TIMESTAMPTZ | DEFAULT now() |
| granted_by | UUID | FK → users(id) ON DELETE SET NULL, NULL |

**PK :** (user_id, role_id, tenant_id)
**Index :** `(tenant_id, user_id)`, `(role_id)`

---

### `role_permissions`

Permissions accordées à un rôle.

| Colonne | Type | Contraintes |
|---|---|---|
| role_id | UUID | FK → roles(id) ON DELETE CASCADE |
| permission_id | UUID | FK → permissions(id) ON DELETE CASCADE |

**PK :** (role_id, permission_id)

---

### `user_permissions`

Permissions individuelles (override par rapport aux rôles).

| Colonne | Type | Contraintes |
|---|---|---|
| user_id | UUID | FK → users(id) ON DELETE CASCADE |
| permission_id | UUID | FK → permissions(id) ON DELETE CASCADE |
| tenant_id | UUID | FK → tenants(id) ON DELETE CASCADE |

**PK :** (user_id, permission_id, tenant_id)
**Index :** `(tenant_id, user_id)`

---

## DOMAINE MENU

### `categories`

Catégories de produits, hiérarchiques (parent_id self-ref).

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants(id) ON DELETE CASCADE, NOT NULL |
| name | VARCHAR(255) | NOT NULL |
| description | TEXT | NULL |
| image_url | TEXT | NULL |
| sort_order | INT | DEFAULT 0 |
| is_active | BOOLEAN | DEFAULT true |
| parent_id | UUID | FK → categories(id) ON DELETE SET NULL, NULL |

**Index :** `(tenant_id, id)`, `(tenant_id, is_active, sort_order)`, `(tenant_id, parent_id)`
**RLS :** Scoped par tenant_id.

---

### `products`

Produits du menu.

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants(id) ON DELETE CASCADE, NOT NULL |
| category_id | UUID | FK → categories(id) ON DELETE SET NULL, NULL |
| name | VARCHAR(255) | NOT NULL |
| description | TEXT | NULL |
| base_price | DECIMAL(10,2) | NOT NULL, DEFAULT 0 |
| sku | VARCHAR(100) | NULL |
| image_url | TEXT | NULL |
| images | JSONB | DEFAULT '[]' |
| tags | TEXT[] | DEFAULT '{}' |
| allergens | TEXT[] | DEFAULT '{}' |
| nutritional_info | JSONB | DEFAULT '{}' |
| is_available | BOOLEAN | DEFAULT true |
| is_featured | BOOLEAN | DEFAULT false |
| sort_order | INT | DEFAULT 0 |

**Contrainte :** UNIQUE(tenant_id, sku) WHERE sku IS NOT NULL
**Index :** `(tenant_id, id)`, `(tenant_id, category_id, is_available)`, `(tenant_id, is_featured)`, `(tenant_id, created_at)`, GIN sur tags
**RLS :** Scoped par tenant_id.

---

### `product_options_groups`

Groupes d'options pour un produit (ex: "Taille", "Suppléments").

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants(id) ON DELETE CASCADE |
| product_id | UUID | FK → products(id) ON DELETE CASCADE |
| name | VARCHAR(255) | NOT NULL |
| type | ENUM | `single \| multiple` |
| is_required | BOOLEAN | DEFAULT false |
| min_select | INT | DEFAULT 0 |
| max_select | INT | DEFAULT 1 |

**Index :** `(tenant_id, product_id)`, `(tenant_id, id)`
**RLS :** Scoped par tenant_id.

---

### `product_options`

Options individuelles dans un groupe.

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| group_id | UUID | FK → product_options_groups(id) ON DELETE CASCADE |
| tenant_id | UUID | FK → tenants(id) ON DELETE CASCADE |
| name | VARCHAR(255) | NOT NULL |
| price_delta | DECIMAL(10,2) | DEFAULT 0 |
| is_default | BOOLEAN | DEFAULT false |
| is_available | BOOLEAN | DEFAULT true |

**Index :** `(tenant_id, group_id)`, `(tenant_id, id)`
**RLS :** Scoped par tenant_id.

---

## DOMAINE COMMANDES

### `orders`

Commandes tous types confondus.

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants(id) ON DELETE CASCADE |
| order_number | VARCHAR(50) | NOT NULL |
| type | ENUM | `dine_in \| takeaway \| delivery \| online` |
| status | VARCHAR(50) | NOT NULL, DEFAULT 'pending' |
| workflow_state_id | UUID | FK → workflow_states(id) ON DELETE SET NULL, NULL |
| table_id | UUID | FK → tables(id) ON DELETE SET NULL, NULL |
| customer_id | UUID | FK → customers(id) ON DELETE SET NULL, NULL |
| agent_id | UUID | FK → users(id) ON DELETE SET NULL |
| subtotal | DECIMAL(10,2) | DEFAULT 0 |
| tax_amount | DECIMAL(10,2) | DEFAULT 0 |
| discount_amount | DECIMAL(10,2) | DEFAULT 0 |
| total | DECIMAL(10,2) | DEFAULT 0 |
| notes | TEXT | NULL |
| delivery_address | JSONB | NULL |
| paid_at | TIMESTAMPTZ | NULL |
| created_at | TIMESTAMPTZ | DEFAULT now() |

**Contrainte :** UNIQUE(tenant_id, order_number)
**Index :** `(tenant_id, id)`, `(tenant_id, created_at)`, `(tenant_id, status)`, `(tenant_id, type, created_at)`, `(tenant_id, workflow_state_id)`
**RLS :** Scoped par tenant_id.

---

### `order_items`

Lignes d'une commande. Les champs `product_name`, `unit_price`, `options` sont des snapshots immutables au moment de la commande.

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| order_id | UUID | FK → orders(id) ON DELETE CASCADE |
| tenant_id | UUID | FK → tenants(id) ON DELETE CASCADE |
| product_id | UUID | FK → products(id) ON DELETE SET NULL, NULL |
| product_name | VARCHAR(255) | NOT NULL (snapshot) |
| unit_price | DECIMAL(10,2) | NOT NULL (snapshot) |
| quantity | INT | NOT NULL, DEFAULT 1 |
| options | JSONB | DEFAULT '[]' (snapshot) |
| notes | TEXT | NULL |
| line_total | DECIMAL(10,2) | NOT NULL |

**Index :** `(tenant_id, order_id)`, `(tenant_id, product_id, created_at)` (pour analytics)
**RLS :** Scoped par tenant_id.

---

### `payments`

Paiements associés à une commande (multiple paiements possibles par commande).

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| order_id | UUID | FK → orders(id) ON DELETE CASCADE |
| tenant_id | UUID | FK → tenants(id) ON DELETE CASCADE |
| method | ENUM | `cash \| card \| mobile_money \| online \| voucher` |
| amount | DECIMAL(10,2) | NOT NULL |
| reference | VARCHAR(255) | NULL |
| status | ENUM | `pending \| completed \| failed \| refunded` |
| metadata | JSONB | DEFAULT '{}' |
| created_at | TIMESTAMPTZ | DEFAULT now() |

**Index :** `(tenant_id, order_id)`, `(tenant_id, created_at)`, `(tenant_id, status)`, `(tenant_id, method, created_at)`
**RLS :** Scoped par tenant_id.

---

## DOMAINE RÉSERVATIONS

### `reservations`

Réservations de tables.

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants(id) ON DELETE CASCADE |
| customer_id | UUID | FK → customers(id) ON DELETE SET NULL, NULL |
| customer_name | VARCHAR(255) | NOT NULL |
| customer_email | VARCHAR(255) | NULL |
| customer_phone | VARCHAR(30) | NULL |
| party_size | INT | NOT NULL, DEFAULT 1 |
| table_id | UUID | FK → tables(id) ON DELETE SET NULL, NULL |
| reserved_at | TIMESTAMPTZ | NOT NULL |
| duration_min | INT | DEFAULT 90 |
| status | ENUM | `pending \| confirmed \| seated \| completed \| cancelled \| no_show` |
| source | ENUM | `website \| phone \| walk_in \| api` |
| notes | TEXT | NULL |
| reminder_sent | BOOLEAN | DEFAULT false |
| created_at | TIMESTAMPTZ | DEFAULT now() |

**Index :** `(tenant_id, id)`, `(tenant_id, reserved_at)`, `(tenant_id, status)`, `(tenant_id, table_id, reserved_at)`
**RLS :** Scoped par tenant_id.

---

### `zones`

Zones de salle (ex: Terrasse, Intérieur, Salle privée).

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants(id) ON DELETE CASCADE |
| name | VARCHAR(100) | NOT NULL |
| is_active | BOOLEAN | DEFAULT true |

**Index :** `(tenant_id, id)`, `(tenant_id, is_active)`
**RLS :** Scoped par tenant_id.

---

### `tables`

Tables d'un restaurant avec positionnement pour plan de salle.

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants(id) ON DELETE CASCADE |
| zone_id | UUID | FK → zones(id) ON DELETE SET NULL, NULL |
| number | VARCHAR(20) | NOT NULL |
| capacity | INT | NOT NULL, DEFAULT 4 |
| shape | ENUM | `round \| square \| rect` |
| pos_x | INT | DEFAULT 0 |
| pos_y | INT | DEFAULT 0 |
| is_active | BOOLEAN | DEFAULT true |

**Contrainte :** UNIQUE(tenant_id, number)
**Index :** `(tenant_id, id)`, `(tenant_id, zone_id, is_active)`, `(tenant_id, is_active)`
**RLS :** Scoped par tenant_id.

---

## DOMAINE CONFIGURATION

### `settings`

Configuration clé-valeur par tenant.

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants(id) ON DELETE CASCADE |
| key | VARCHAR(255) | NOT NULL |
| value | JSONB | NOT NULL |
| type | ENUM | `string \| number \| boolean \| json \| array` |
| category | VARCHAR(100) | NULL |
| updated_at | TIMESTAMPTZ | DEFAULT now() |

**Contrainte :** UNIQUE(tenant_id, key)
**Index :** `(tenant_id, key)`, `(tenant_id, category)`
**RLS :** Scoped par tenant_id.

---

### `custom_fields`

Définition de champs personnalisés par tenant pour étendre les entités.

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants(id) ON DELETE CASCADE |
| entity_type | VARCHAR(50) | NOT NULL (product, order, customer…) |
| name | VARCHAR(100) | NOT NULL |
| label | VARCHAR(255) | NOT NULL |
| field_type | ENUM | `string \| number \| boolean \| date \| select \| text` |
| options | JSONB | NULL (pour type select) |
| is_required | BOOLEAN | DEFAULT false |
| is_shown_on_vitrine | BOOLEAN | DEFAULT false |
| sort_order | INT | DEFAULT 0 |

**Index :** `(tenant_id, entity_type, sort_order)`, `(tenant_id, id)`
**RLS :** Scoped par tenant_id.

---

### `custom_field_values`

Valeurs des champs personnalisés pour chaque entité. Une seule colonne value est non-null selon field_type.

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants(id) ON DELETE CASCADE |
| custom_field_id | UUID | FK → custom_fields(id) ON DELETE CASCADE |
| entity_id | UUID | NOT NULL |
| entity_type | VARCHAR(50) | NOT NULL |
| value_string | TEXT | NULL |
| value_number | DECIMAL(15,4) | NULL |
| value_boolean | BOOLEAN | NULL |
| value_date | DATE | NULL |

**Contrainte :** UNIQUE(custom_field_id, entity_id)
**Index :** `(tenant_id, entity_type, entity_id)`, `(tenant_id, custom_field_id)`
**RLS :** Scoped par tenant_id.

---

## DOMAINE WORKFLOWS

### `workflow_definitions`

Définition d'un workflow (cycle de vie) pour une entité.

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants(id) ON DELETE CASCADE |
| entity_type | VARCHAR(50) | NOT NULL (order, reservation…) |
| name | VARCHAR(255) | NOT NULL |
| is_default | BOOLEAN | DEFAULT false |

**Index :** `(tenant_id, entity_type)`, `(tenant_id, id)`
**RLS :** Scoped par tenant_id.

---

### `workflow_states`

États dans un workflow.

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| workflow_id | UUID | FK → workflow_definitions(id) ON DELETE CASCADE |
| tenant_id | UUID | FK → tenants(id) ON DELETE CASCADE |
| name | VARCHAR(100) | NOT NULL |
| slug | VARCHAR(100) | NOT NULL |
| color | VARCHAR(7) | NOT NULL (hex #RRGGBB) |
| is_initial | BOOLEAN | DEFAULT false |
| is_terminal | BOOLEAN | DEFAULT false |
| triggers_alert | BOOLEAN | DEFAULT false |
| sort_order | INT | DEFAULT 0 |

**Index :** `(tenant_id, workflow_id, sort_order)`, `(tenant_id, id)`
**RLS :** Scoped par tenant_id.

---

### `workflow_transitions`

Transitions autorisées entre états.

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| workflow_id | UUID | FK → workflow_definitions(id) ON DELETE CASCADE |
| from_state_id | UUID | FK → workflow_states(id) ON DELETE CASCADE, NULL (= depuis n'importe quel état) |
| to_state_id | UUID | FK → workflow_states(id) ON DELETE CASCADE |
| name | VARCHAR(100) | NOT NULL |
| allowed_roles | TEXT[] | DEFAULT '{}' |
| conditions | JSONB | DEFAULT '{}' |

**Index :** `(workflow_id, from_state_id)`, `(workflow_id, to_state_id)`
**RLS :** Scoped par tenant via workflow_id → workflow_definitions.tenant_id.

---

## DOMAINE SITE VITRINE

### `website_settings`

Configuration du site vitrine public d'un tenant (1:1 avec tenant).

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | UNIQUE, FK → tenants(id) ON DELETE CASCADE |
| theme_id | UUID | FK → themes(id) ON DELETE SET NULL, NULL |
| custom_domain | VARCHAR(255) | NULL |
| is_published | BOOLEAN | DEFAULT false |
| primary_color | VARCHAR(7) | DEFAULT '#C8553D' |
| secondary_color | VARCHAR(7) | DEFAULT '#D4A843' |
| logo_url | TEXT | NULL |
| favicon_url | TEXT | NULL |
| hero_image_url | TEXT | NULL |
| seo_title | VARCHAR(255) | NULL |
| seo_description | TEXT | NULL |
| seo_keywords | TEXT | NULL |
| google_analytics | VARCHAR(50) | NULL |
| sections_config | JSONB | DEFAULT '{}' |
| social_links | JSONB | DEFAULT '{}' |
| font_heading | VARCHAR(100) | DEFAULT 'Plus Jakarta Sans' |
| font_body | VARCHAR(100) | DEFAULT 'DM Sans' |

**Index :** `(tenant_id)`, `(custom_domain)` WHERE custom_domain IS NOT NULL
**RLS :** Lecture publique pour vitrines publiées. Écriture scoped par tenant_id.

---

### `themes`

Thèmes disponibles pour les sites vitrines.

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR(100) | NOT NULL |
| slug | VARCHAR(100) | UNIQUE |
| preview_url | TEXT | NULL |
| config | JSONB | DEFAULT '{}' |
| is_premium | BOOLEAN | DEFAULT false |
| is_active | BOOLEAN | DEFAULT true |

**Index :** `(slug)`, `(is_active, is_premium)`

---

### `pages`

Pages de contenu du site vitrine.

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants(id) ON DELETE CASCADE |
| title | VARCHAR(255) | NOT NULL |
| slug | VARCHAR(255) | NOT NULL |
| content | JSONB | DEFAULT '{}' |
| is_published | BOOLEAN | DEFAULT false |
| seo_title | VARCHAR(255) | NULL |
| seo_description | TEXT | NULL |
| sort_order | INT | DEFAULT 0 |
| created_at | TIMESTAMPTZ | DEFAULT now() |

**Contrainte :** UNIQUE(tenant_id, slug)
**Index :** `(tenant_id, slug)`, `(tenant_id, is_published, sort_order)`
**RLS :** Scoped par tenant_id.

---

## DOMAINE MODULES

### `modules`

Catalogue des modules disponibles sur la plateforme.

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR(100) | NOT NULL |
| slug | VARCHAR(50) | UNIQUE, NOT NULL |
| description | TEXT | NULL |
| icon | VARCHAR(50) | NULL |
| version | VARCHAR(20) | DEFAULT '1.0.0' |
| is_active | BOOLEAN | DEFAULT true |
| required_plan | VARCHAR(50) | NOT NULL (starter, growth, enterprise) |

**Index :** `(slug)`, `(is_active)`

---

### `tenant_modules`

Modules activés par tenant.

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants(id) ON DELETE CASCADE |
| module_id | UUID | FK → modules(id) ON DELETE CASCADE |
| is_active | BOOLEAN | DEFAULT true |
| config | JSONB | DEFAULT '{}' |
| activated_at | TIMESTAMPTZ | DEFAULT now() |
| expires_at | TIMESTAMPTZ | NULL |

**Contrainte :** UNIQUE(tenant_id, module_id)
**Index :** `(tenant_id, is_active)`, `(tenant_id, module_id)`
**RLS :** Scoped par tenant_id.

---

## DOMAINE RÈGLES

### `rules`

Règles métier automatisées (déclenchées par événements).

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants(id) ON DELETE CASCADE |
| name | VARCHAR(255) | NOT NULL |
| event_trigger | VARCHAR(100) | NOT NULL (ex: order.created, payment.completed) |
| conditions | JSONB | DEFAULT '[]' |
| condition_logic | ENUM | `AND \| OR`, DEFAULT 'AND' |
| actions | JSONB | DEFAULT '[]' |
| is_active | BOOLEAN | DEFAULT true |
| priority | INT | DEFAULT 0 |
| created_at | TIMESTAMPTZ | DEFAULT now() |

**Index :** `(tenant_id, event_trigger, is_active)`, `(tenant_id, id)`, `(tenant_id, created_at)`
**RLS :** Scoped par tenant_id.

---

## DOMAINE CRM

### `customers`

Clients du restaurant. Mis à jour automatiquement via triggers sur orders et payments.

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants(id) ON DELETE CASCADE |
| first_name | VARCHAR(100) | NOT NULL |
| last_name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(255) | NULL |
| phone | VARCHAR(30) | NULL |
| total_orders | INT | DEFAULT 0 |
| total_spent | DECIMAL(12,2) | DEFAULT 0 |
| loyalty_points | INT | DEFAULT 0 |
| last_visit_at | TIMESTAMPTZ | NULL |
| segment | ENUM | `new \| regular \| vip \| inactive`, DEFAULT 'new' |
| notes | TEXT | NULL |
| created_at | TIMESTAMPTZ | DEFAULT now() |

**Contrainte :** UNIQUE(tenant_id, email) WHERE email IS NOT NULL, UNIQUE(tenant_id, phone) WHERE phone IS NOT NULL
**Index :** `(tenant_id, id)`, `(tenant_id, created_at)`, `(tenant_id, segment)`, `(tenant_id, last_visit_at)`
**RLS :** Scoped par tenant_id.

---

## DOMAINE LIVRAISON

### `delivery_zones`

Zones de livraison configurées par un tenant.

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants(id) ON DELETE CASCADE |
| name | VARCHAR(100) | NOT NULL |
| type | ENUM | `radius \| polygon` |
| radius_km | DECIMAL(8,2) | NULL |
| polygon | JSONB | NULL (GeoJSON coordinates) |
| min_order | DECIMAL(10,2) | DEFAULT 0 |
| delivery_fee | DECIMAL(10,2) | DEFAULT 0 |
| is_active | BOOLEAN | DEFAULT true |

**Index :** `(tenant_id, id)`, `(tenant_id, is_active)`
**RLS :** Scoped par tenant_id.

---

### `delivery_agents`

Livreurs rattachés à un tenant.

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants(id) ON DELETE CASCADE |
| user_id | UUID | FK → users(id) ON DELETE CASCADE |
| name | VARCHAR(255) | NOT NULL |
| phone | VARCHAR(30) | NULL |
| is_available | BOOLEAN | DEFAULT false |
| zone_id | UUID | FK → delivery_zones(id) ON DELETE SET NULL, NULL |
| created_at | TIMESTAMPTZ | DEFAULT now() |

**Index :** `(tenant_id, id)`, `(tenant_id, is_available)`, `(tenant_id, user_id)`
**RLS :** Scoped par tenant_id.

---

### `deliveries`

Suivi des livraisons en cours et historique.

| Colonne | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| order_id | UUID | FK → orders(id) ON DELETE CASCADE |
| tenant_id | UUID | FK → tenants(id) ON DELETE CASCADE |
| agent_id | UUID | FK → delivery_agents(id) ON DELETE SET NULL, NULL |
| status | ENUM | `pending \| assigned \| picked_up \| en_route \| delivered \| failed` |
| assigned_at | TIMESTAMPTZ | NULL |
| picked_up_at | TIMESTAMPTZ | NULL |
| delivered_at | TIMESTAMPTZ | NULL |
| notes | TEXT | NULL |

**Index :** `(tenant_id, id)`, `(tenant_id, status)`, `(tenant_id, agent_id, status)`, `(order_id)`
**RLS :** Scoped par tenant_id.

---

## NOTES GLOBALES

### Index universels (toutes tables métier)
- `(tenant_id, id)` : lookup par tenant + entité
- `(tenant_id, created_at DESC)` : analytics et listes paginées

### Politique RLS globale
```sql
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;

-- Politique tenant
CREATE POLICY tenant_isolation ON <table>
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Super admin bypass (role postgres configuré)
CREATE POLICY super_admin_bypass ON <table>
  USING (current_setting('app.role') = 'super_admin');
```

### Triggers standards
```sql
-- updated_at automatique
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON <table>
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```
