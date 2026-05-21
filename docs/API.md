# API — Référence endpoints REST TÉRANGATABLE

## Conventions générales

```
Base URL       : https://api.terangatable.com/v1
Auth           : Authorization: Bearer {accessToken}
Tenant scope   : X-Tenant-ID: {uuid}
Content-Type   : application/json
```

### Pagination (tous les endpoints liste)
```
?page=1&limit=20&sort=created_at&order=desc
```

### Format réponse succès
```json
{
  "data": { ... } | [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 145,
    "totalPages": 8
  }
}
```

### Format erreur
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "La commande demandée n'existe pas.",
    "details": []
  }
}
```

### Codes HTTP utilisés
| Code | Signification |
|---|---|
| 200 | OK |
| 201 | Créé |
| 204 | Succès sans contenu |
| 400 | Requête invalide / validation échouée |
| 401 | Non authentifié |
| 403 | Interdit (mauvais rôle ou tenant) |
| 404 | Ressource introuvable |
| 409 | Conflit (unicité) |
| 422 | Données non traitables |
| 429 | Rate limit |
| 500 | Erreur serveur |

---

## AUTH — Public (pas de X-Tenant-ID)

### `POST /v1/auth/login`
Authentifie un utilisateur et retourne les tokens JWT.

**Body**
```json
{ "email": "string", "password": "string" }
```

**Réponse 200**
```json
{
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": {
      "id": "uuid",
      "email": "string",
      "first_name": "string",
      "last_name": "string",
      "tenant_id": "uuid | null",
      "roles": ["manager"]
    }
  }
}
```

---

### `POST /v1/auth/refresh`
Renouvelle les tokens via le refreshToken.

**Body**
```json
{ "refreshToken": "string" }
```

**Réponse 200** → même structure que login

---

### `POST /v1/auth/logout`
Invalide le refreshToken côté serveur.

**Body**
```json
{ "refreshToken": "string" }
```

**Réponse 204** — pas de corps

---

### `POST /v1/auth/forgot-password`
Envoie un email de réinitialisation de mot de passe.

**Body**
```json
{ "email": "string" }
```

**Réponse 204** — toujours 204 (pas de fuite d'existence email)

---

### `POST /v1/auth/reset-password`
Réinitialise le mot de passe via token reçu par email.

**Body**
```json
{ "token": "string", "password": "string" }
```

**Réponse 204**

---

### `GET /v1/auth/me`
Retourne l'utilisateur authentifié courant.

**Réponse 200**
```json
{
  "data": {
    "id": "uuid",
    "email": "string",
    "first_name": "string",
    "last_name": "string",
    "tenant_id": "uuid | null",
    "roles": ["string"],
    "permissions": ["module:action:resource"]
  }
}
```

---

## TENANT REQUESTS — Public

### `POST /v1/tenant-requests`
Soumet une demande d'inscription d'un nouveau restaurant.

**Body**
```json
{
  "region_id": "uuid",
  "owner_name": "string",
  "owner_email": "string",
  "restaurant_name": "string",
  "phone": "string?",
  "city": "string?",
  "message": "string?"
}
```

**Réponse 201**
```json
{ "data": { "id": "uuid", "status": "pending" } }
```

---

### `GET /v1/tenant-requests/:id`
Consulte le statut d'une demande par son ID (sans authentification).

**Réponse 200**
```json
{
  "data": {
    "id": "uuid",
    "restaurant_name": "string",
    "status": "pending | approved | rejected",
    "created_at": "ISO8601"
  }
}
```

---

## SUPER ADMIN — TENANTS (SuperAdminGuard)

### `GET /v1/admin/tenants`
Liste tous les tenants avec filtres.

**Query params :** `region=uuid`, `status=active|suspended|trial|deleted`, `page`, `limit`

**Réponse 200** → liste de tenants avec meta pagination

---

### `GET /v1/admin/tenants/:id`
Détail d'un tenant.

---

### `PATCH /v1/admin/tenants/:id/suspend`
Suspend un tenant actif.

**Body**
```json
{ "reason": "string?" }
```

**Réponse 200**

---

### `PATCH /v1/admin/tenants/:id/activate`
Réactive un tenant suspendu.

**Réponse 200**

---

### `DELETE /v1/admin/tenants/:id`
Marque le tenant comme `deleted` (soft delete).

**Réponse 204**

---

## SUPER ADMIN — REQUESTS

### `GET /v1/admin/requests`
Liste les demandes d'inscription.

**Query params :** `status=pending|approved|rejected`, `region=uuid`, `page`, `limit`

---

### `PATCH /v1/admin/requests/:id/approve`
Approuve une demande et crée automatiquement le tenant + utilisateur owner.

**Body**
```json
{
  "plan_id": "uuid",
  "slug": "string"
}
```

**Réponse 200**
```json
{
  "data": {
    "request": { ... },
    "tenant": { "id": "uuid", "slug": "string" }
  }
}
```

---

### `PATCH /v1/admin/requests/:id/reject`
Rejette une demande.

**Body**
```json
{ "reason": "string?" }
```

**Réponse 200**

---

## SUPER ADMIN — REGIONS

### `GET /v1/admin/regions`
Liste toutes les régions.

### `POST /v1/admin/regions`
Crée une nouvelle région.

**Body** → champs de la table `regions`

### `PATCH /v1/admin/regions/:id`
Met à jour une région.

### `PATCH /v1/admin/regions/:id/assign-admin`
Assigne un admin régional à une région.

**Body**
```json
{ "userId": "uuid" }
```

**Réponse 200**

---

## MENU (TenantGuard — X-Tenant-ID requis)

### `GET /v1/categories`
Liste les catégories du tenant courant (arborescence).

**Réponse 200** → tableau de catégories avec enfants imbriqués si `?tree=true`

### `POST /v1/categories`
Crée une catégorie.

**Body**
```json
{
  "name": "string",
  "description": "string?",
  "image_url": "string?",
  "sort_order": "number?",
  "parent_id": "uuid?"
}
```

### `PATCH /v1/categories/:id`
Met à jour une catégorie.

### `DELETE /v1/categories/:id`
Supprime une catégorie (déplace les produits orphelins si nécessaire).

### `PATCH /v1/categories/reorder`
Réordonne les catégories.

**Body**
```json
[{ "id": "uuid", "sort_order": 0 }, ...]
```

---

### `GET /v1/products`
Liste les produits avec filtres.

**Query params :** `category_id=uuid`, `is_available=true|false`, `search=string`, `is_featured=true`, `page`, `limit`

### `POST /v1/products`
Crée un produit.

**Body** → champs de la table `products` (hors tenant_id)

### `GET /v1/products/:id`
Détail d'un produit.

**Query params :** `include_custom_fields=true` → inclut les custom_field_values

### `PATCH /v1/products/:id`
Met à jour un produit.

### `DELETE /v1/products/:id`
Supprime un produit (soft delete via is_available=false recommandé si des commandes référencent).

### `PATCH /v1/products/:id/availability`
Toggle disponibilité rapide.

**Body**
```json
{ "is_available": true }
```

### `POST /v1/products/:id/upload-image`
Upload image principale du produit.

**Content-Type :** `multipart/form-data`
**Body :** champ `image` (fichier)

**Réponse 200**
```json
{ "data": { "image_url": "https://cdn.terangatable.com/..." } }
```

---

### `GET /v1/products/:id/options-groups`
Liste les groupes d'options d'un produit.

### `POST /v1/products/:id/options-groups`
Crée un groupe d'options.

**Body**
```json
{
  "name": "string",
  "type": "single | multiple",
  "is_required": false,
  "min_select": 0,
  "max_select": 1
}
```

### `PATCH /v1/options-groups/:id`
Met à jour un groupe d'options.

### `DELETE /v1/options-groups/:id`
Supprime un groupe et ses options.

### `POST /v1/options-groups/:id/options`
Ajoute une option dans un groupe.

**Body**
```json
{
  "name": "string",
  "price_delta": 0,
  "is_default": false,
  "is_available": true
}
```

### `PATCH /v1/options/:id`
Met à jour une option.

### `DELETE /v1/options/:id`
Supprime une option.

---

## COMMANDES

### `GET /v1/orders`
Liste les commandes du tenant.

**Query params :** `status=string`, `type=dine_in|takeaway|delivery|online`, `from=ISO8601`, `to=ISO8601`, `page`, `limit`

### `POST /v1/orders`
Crée une commande.

**Body**
```json
{
  "type": "dine_in | takeaway | delivery | online",
  "table_id": "uuid?",
  "customer_id": "uuid?",
  "items": [
    {
      "product_id": "uuid",
      "quantity": 1,
      "options": [{ "option_id": "uuid" }],
      "notes": "string?"
    }
  ],
  "notes": "string?",
  "delivery_address": "object?"
}
```

**Réponse 201** → commande complète avec order_number généré

### `GET /v1/orders/:id`
Détail d'une commande.

**Query params :** `expand=items,customer,payment` (virgule-séparé)

### `PATCH /v1/orders/:id`
Met à jour les métadonnées d'une commande (notes, delivery_address).

### `POST /v1/orders/:id/transition`
Applique une transition de workflow à une commande.

**Body**
```json
{
  "transitionId": "uuid",
  "notes": "string?"
}
```

**Réponse 200** → commande avec nouvel état

### `POST /v1/orders/:id/cancel`
Annule une commande (shortcut vers la transition d'annulation).

**Body**
```json
{ "reason": "string" }
```

---

## PAIEMENTS

### `GET /v1/payments`
Liste les paiements.

**Query params :** `order_id=uuid`, `method=cash|card|...`, `status=pending|completed|...`, `from=ISO8601`, `to=ISO8601`, `page`, `limit`

### `POST /v1/payments`
Enregistre un paiement.

**Body**
```json
{
  "order_id": "uuid",
  "method": "cash | card | mobile_money | online | voucher",
  "amount": 5000,
  "reference": "string?",
  "metadata": "object?"
}
```

**Réponse 201**

### `POST /v1/payments/:id/refund`
Initie un remboursement.

**Body**
```json
{
  "amount": 2500,
  "reason": "string?"
}
```

**Réponse 200** → paiement avec status=refunded

---

## RÉSERVATIONS

### `GET /v1/reservations`
Liste les réservations.

**Query params :** `date=YYYY-MM-DD`, `status=pending|confirmed|...`, `page`, `limit`

### `POST /v1/reservations`
Crée une réservation.

**Body**
```json
{
  "customer_name": "string",
  "customer_email": "string?",
  "customer_phone": "string?",
  "party_size": 4,
  "table_id": "uuid?",
  "reserved_at": "ISO8601",
  "duration_min": 90,
  "source": "website | phone | walk_in | api",
  "notes": "string?"
}
```

### `GET /v1/reservations/:id`
Détail d'une réservation.

### `PATCH /v1/reservations/:id`
Met à jour une réservation.

### `DELETE /v1/reservations/:id`
Annule une réservation (status → cancelled).

### `GET /v1/tables/availability`
Retourne les tables disponibles pour un créneau.

**Query params :** `date=ISO8601` (requis), `party_size=int` (requis)

**Réponse 200**
```json
{
  "data": [
    {
      "table": { "id": "uuid", "number": "T1", "capacity": 4 },
      "is_available": true,
      "conflicts": []
    }
  ]
}
```

---

## TABLES & ZONES

### `GET /v1/zones`
Liste les zones avec leurs tables.

### `POST /v1/zones`
Crée une zone.

**Body**
```json
{ "name": "string", "is_active": true }
```

### `GET /v1/tables`
Liste toutes les tables du tenant.

**Query params :** `zone_id=uuid`, `is_active=true`

### `POST /v1/tables`
Crée une table.

**Body**
```json
{
  "zone_id": "uuid",
  "number": "T1",
  "capacity": 4,
  "shape": "round | square | rect",
  "pos_x": 0,
  "pos_y": 0
}
```

### `PATCH /v1/tables/:id`
Met à jour une table (position, capacité, etc.).

---

## WORKFLOWS

### `GET /v1/workflows`
Liste les workflows du tenant.

### `POST /v1/workflows`
Crée un workflow.

**Body**
```json
{
  "entity_type": "order | reservation",
  "name": "string",
  "is_default": false
}
```

### `GET /v1/workflows/:id`
Détail d'un workflow avec ses états et transitions.

### `PATCH /v1/workflows/:id`
Met à jour un workflow.

### `DELETE /v1/workflows/:id`
Supprime un workflow (interdit si is_default ou si des entités l'utilisent).

### `POST /v1/workflows/:id/states`
Ajoute un état à un workflow.

**Body**
```json
{
  "name": "string",
  "slug": "string",
  "color": "#3B82F6",
  "is_initial": false,
  "is_terminal": false,
  "triggers_alert": false,
  "sort_order": 0
}
```

### `PATCH /v1/workflow-states/:id`
Met à jour un état.

### `POST /v1/workflow-states/:id/transitions`
Ajoute une transition depuis cet état.

**Body**
```json
{
  "to_state_id": "uuid",
  "name": "string",
  "allowed_roles": ["manager", "serveur"],
  "conditions": {}
}
```

### `PATCH /v1/workflow-transitions/:id`
Met à jour une transition.

### `GET /v1/orders/:id/available-transitions`
Retourne les transitions disponibles pour une commande selon son état actuel et le rôle de l'utilisateur.

**Réponse 200**
```json
{
  "data": [
    {
      "transition": { "id": "uuid", "name": "Envoyer en cuisine" },
      "to_state": { "id": "uuid", "name": "En cuisine", "color": "#3B82F6" }
    }
  ]
}
```

---

## CLIENTS CRM

### `GET /v1/customers`
Liste les clients.

**Query params :** `segment=new|regular|vip|inactive`, `search=string`, `page`, `limit`

### `POST /v1/customers`
Crée un client.

**Body** → champs de la table `customers` (hors tenant_id et stats calculées)

### `GET /v1/customers/:id`
Détail d'un client.

### `PATCH /v1/customers/:id`
Met à jour un client.

### `GET /v1/customers/:id/orders`
Historique des commandes d'un client.

**Query params :** `page`, `limit`

### `POST /v1/customers/:id/loyalty/add`
Ajoute (ou retire si valeur négative) des points de fidélité.

**Body**
```json
{
  "points": 50,
  "reason": "string"
}
```

**Réponse 200**
```json
{ "data": { "loyalty_points": 150 } }
```

---

## ANALYTICS

> Tous les endpoints analytics requièrent le module `analytics` actif.

### `GET /v1/analytics/summary`
Synthèse globale de la période.

**Query params :** `from=ISO8601` (requis), `to=ISO8601` (requis)

**Réponse 200**
```json
{
  "data": {
    "total_orders": 432,
    "total_revenue": 2150000,
    "avg_order_value": 4977,
    "new_customers": 18,
    "top_payment_method": "mobile_money"
  }
}
```

### `GET /v1/analytics/revenue`
Revenu groupé par période.

**Query params :** `from`, `to`, `group_by=day|week|month`

### `GET /v1/analytics/top-products`
Top produits commandés.

**Query params :** `from`, `to`, `limit=10`

### `GET /v1/analytics/peak-hours`
Heures de pointe (commandes par tranche horaire).

**Query params :** `from`, `to`

### `GET /v1/analytics/staff-performance`
Performance par membre du staff.

**Query params :** `from`, `to`

### `GET /v1/analytics/export`
Export des données analytics.

**Query params :** `from`, `to`, `format=csv|pdf`

**Réponse 200** → fichier binaire avec Content-Disposition header

---

## WEBSITE

### `GET /v1/website/settings`
Retourne la configuration complète du site vitrine.

### `PATCH /v1/website/settings`
Met à jour la configuration du site vitrine.

**Body** → champs partiels de `website_settings`

### `POST /v1/website/publish`
Publie le site vitrine (is_published → true + invalide cache ISR).

**Réponse 200**

### `POST /v1/website/unpublish`
Dépublie le site vitrine.

**Réponse 200**

### `GET /v1/website/themes`
Liste les thèmes disponibles (filtrés selon le plan du tenant).

### `POST /v1/website/upload-logo`
Upload le logo du restaurant.

**Content-Type :** `multipart/form-data`
**Body :** champ `logo`

**Réponse 200**
```json
{ "data": { "logo_url": "https://cdn.terangatable.com/..." } }
```

### `POST /v1/website/upload-hero`
Upload l'image hero de la page d'accueil.

**Content-Type :** `multipart/form-data`
**Body :** champ `hero`

---

## LIVRAISON

> Requiert le module `delivery` actif.

### `GET /v1/delivery/zones`
Liste les zones de livraison.

### `POST /v1/delivery/zones`
Crée une zone de livraison.

**Body**
```json
{
  "name": "string",
  "type": "radius | polygon",
  "radius_km": 5.0,
  "polygon": null,
  "min_order": 3000,
  "delivery_fee": 500
}
```

### `PATCH /v1/delivery/zones/:id`
Met à jour une zone.

### `GET /v1/delivery/agents`
Liste les livreurs.

### `POST /v1/delivery/agents`
Crée un livreur (user_id requis — l'utilisateur doit avoir le rôle livreur).

**Body**
```json
{
  "user_id": "uuid",
  "name": "string",
  "phone": "string?",
  "zone_id": "uuid?"
}
```

### `PATCH /v1/delivery/agents/:id/availability`
Toggle disponibilité d'un livreur.

**Body**
```json
{ "is_available": true }
```

### `GET /v1/delivery/active`
Retourne toutes les livraisons en cours (status ≠ delivered et ≠ failed) avec agent et commande.

---

## RÈGLES MÉTIER

> Requiert le module `rules_engine` actif.

### `GET /v1/rules`
Liste les règles du tenant.

### `POST /v1/rules`
Crée une règle.

**Body**
```json
{
  "name": "string",
  "event_trigger": "order.created | payment.completed | ...",
  "conditions": [
    { "field": "total", "operator": "gte", "value": 10000 }
  ],
  "condition_logic": "AND | OR",
  "actions": [
    { "type": "add_loyalty_points", "params": { "points": 10 } }
  ],
  "priority": 0
}
```

### `PATCH /v1/rules/:id`
Met à jour une règle.

### `DELETE /v1/rules/:id`
Supprime une règle.

### `PATCH /v1/rules/:id/toggle`
Active ou désactive une règle.

**Réponse 200**
```json
{ "data": { "is_active": true } }
```

### `POST /v1/rules/:id/test`
Teste une règle contre un payload simulé sans l'exécuter réellement.

**Body**
```json
{
  "event": "order.created",
  "payload": { "total": 15000, "type": "delivery" }
}
```

**Réponse 200**
```json
{
  "data": {
    "conditions_met": true,
    "actions_to_execute": [{ "type": "add_loyalty_points", "params": { "points": 10 } }]
  }
}
```

---

## CUSTOM FIELDS

> Requiert le module `custom_fields` actif.

### `GET /v1/custom-fields`
Liste les champs personnalisés par type d'entité.

**Query params :** `entity_type=product|order|customer`

### `POST /v1/custom-fields`
Crée un champ personnalisé.

**Body**
```json
{
  "entity_type": "product",
  "name": "halal_certified",
  "label": "Certifié Halal",
  "field_type": "boolean",
  "is_required": false,
  "is_shown_on_vitrine": true,
  "sort_order": 0
}
```

### `PATCH /v1/custom-fields/:id`
Met à jour un champ personnalisé.

### `DELETE /v1/custom-fields/:id`
Supprime un champ et toutes ses valeurs associées.

---

## MODULES

### `GET /v1/modules`
Liste les modules disponibles pour le tenant selon son plan, avec statut d'activation.

**Réponse 200**
```json
{
  "data": [
    {
      "module": { "id": "uuid", "slug": "pos", "name": "Point of Sale" },
      "is_active": true,
      "plan_compatible": true
    }
  ]
}
```

### `PATCH /v1/modules/:slug/toggle`
Active ou désactive un module pour le tenant courant.

**Vérification :** le plan du tenant doit être compatible avec le `required_plan` du module.

**Réponse 200**
```json
{ "data": { "slug": "delivery", "is_active": true } }
```
