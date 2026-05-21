# REGIONS — Données, logique de résolution et guards TÉRANGATABLE

---

## Données des régions (seed PostgreSQL)

Ces enregistrements sont insérés lors du premier déploiement via `seed/regions.ts`.

```ts
const regions = [
  {
    name: "Dakar",
    slug: "dakar",
    country_code: "SN",
    country_name: "Sénégal",
    platform_label: "TérangaTable Dakar",
    timezone: "Africa/Dakar",
    currency_code: "XOF",
    currency_symbol: "F CFA",
    locale: "fr-SN",
    phone_prefix: "+221",
    is_active: true,
  },
  {
    name: "Thiès",
    slug: "thies",
    country_code: "SN",
    country_name: "Sénégal",
    platform_label: "TérangaTable Thiès",
    timezone: "Africa/Dakar",
    currency_code: "XOF",
    currency_symbol: "F CFA",
    locale: "fr-SN",
    phone_prefix: "+221",
    is_active: true,
  },
  {
    name: "Saint-Louis",
    slug: "saint-louis",
    country_code: "SN",
    country_name: "Sénégal",
    platform_label: "TérangaTable Saint-Louis",
    timezone: "Africa/Dakar",
    currency_code: "XOF",
    currency_symbol: "F CFA",
    locale: "fr-SN",
    phone_prefix: "+221",
    is_active: true,
  },
  {
    name: "Abidjan",
    slug: "abidjan",
    country_code: "CI",
    country_name: "Côte d'Ivoire",
    platform_label: "TérangaTable Abidjan",
    timezone: "Africa/Abidjan",
    currency_code: "XOF",
    currency_symbol: "F CFA",
    locale: "fr-CI",
    phone_prefix: "+225",
    is_active: true,
  },
  {
    name: "Casablanca",
    slug: "casablanca",
    country_code: "MA",
    country_name: "Maroc",
    platform_label: "TérangaTable Casablanca",
    timezone: "Africa/Casablanca",
    currency_code: "MAD",
    currency_symbol: "DH",
    locale: "fr-MA",
    phone_prefix: "+212",
    is_active: true,
  },
  {
    name: "Paris",
    slug: "paris",
    country_code: "FR",
    country_name: "France",
    platform_label: "TérangaTable Paris",
    timezone: "Europe/Paris",
    currency_code: "EUR",
    currency_symbol: "€",
    locale: "fr-FR",
    phone_prefix: "+33",
    is_active: false, // désactivé — pas encore ouvert
  },
];
```

---

## Logique de résolution du tenant (middleware Next.js)

Le middleware s'exécute sur chaque requête entrante avant les API routes et les pages.

### Ordre de résolution (priorité décroissante)

```
1. Sous-domaine plateforme
   {slug}.terangatable.com
   → lookup Redis : "tenant:slug:{slug}" → tenantId

2. Domaine personnalisé
   {domain} (ex: restaurant-dakar.com)
   → lookup Redis : "domain:{domain}" → slug
   → lookup Redis : "tenant:slug:{slug}" → tenantId

3. Header API explicite
   X-Tenant-ID: {uuid}
   → lookup Redis : "tenant:id:{uuid}" → tenant object

4. Super admin
   Pas de résolution tenant — SuperAdminGuard bypass total
```

### Implémentation pseudo-code

```ts
async function resolveTenant(req: NextRequest): Promise<Tenant | null> {
  // 1. Sous-domaine
  const host = req.headers.get("host") ?? "";
  const subdomain = extractSubdomain(host); // ex: "monrestaurant"
  if (subdomain && subdomain !== "app" && subdomain !== "api") {
    const tenantId = await redis.get(`tenant:slug:${subdomain}`);
    if (tenantId) return fetchTenantById(tenantId);
  }

  // 2. Domaine personnalisé
  const domainSlug = await redis.get(`domain:${host}`);
  if (domainSlug) {
    const tenantId = await redis.get(`tenant:slug:${domainSlug}`);
    if (tenantId) return fetchTenantById(tenantId);
  }

  // 3. Header API
  const tenantIdHeader = req.headers.get("x-tenant-id");
  if (tenantIdHeader) {
    return fetchTenantById(tenantIdHeader);
  }

  return null; // sera géré par SuperAdminGuard ou rejeté
}
```

---

## Cache Redis — Clés et TTL

| Clé | Valeur | TTL |
|---|---|---|
| `tenant:slug:{slug}` | tenantId (UUID string) | 3600s (1h) |
| `tenant:id:{id}` | JSON complet du tenant | 3600s (1h) |
| `domain:{domain}` | slug (string) | 86400s (24h) |

### Invalidation obligatoire

Les clés cache doivent être invalidées dans ces cas :

```ts
// À appeler dans TenantService.update() et WebsiteSettingsService.update()
async function invalidateTenantCache(tenantId: string, slug: string, customDomain?: string) {
  await redis.del(`tenant:slug:${slug}`);
  await redis.del(`tenant:id:${tenantId}`);
  if (customDomain) {
    await redis.del(`domain:${customDomain}`);
  }
}
```

---

## Guards d'authentification

### `SuperAdminGuard`

Vérifie que l'utilisateur authentifié est un super admin (aucune restriction région/tenant).

```ts
// Critères de validation
- users.tenant_id IS NULL
- role.slug = 'super_admin'
- users.is_active = true

// En cas d'échec
throw ForbiddenException("Accès réservé aux super administrateurs");
```

**Endpoints concernés :** tous les `GET|POST|PATCH|DELETE /v1/admin/*`

---

### `RegionalAdminGuard`

Vérifie que l'admin régional n'accède qu'aux données de sa région.

```ts
// Critères de validation
- users.tenant_id IS NULL
- role.slug = 'regional_admin'
- users.is_active = true

// Vérification de la région
const adminRegionId = user.settings?.region_id ?? user.region_id;
const requestedRegionId = req.params.regionId ?? req.body.region_id;

if (requestedRegionId && requestedRegionId !== adminRegionId) {
  throw ForbiddenException("Accès limité à votre région");
}
```

**Endpoints concernés :** `/v1/admin/requests` (filtrés par région), `/v1/admin/tenants` (filtrés par région)

---

### `TenantGuard`

Vérifie que l'utilisateur appartient au tenant résolu et que le tenant est actif.

```ts
// Critères de validation
- tenant résolu (via middleware) !== null
- tenant.status = 'active' ou 'trial' (trial_ends_at non dépassé)
- users.tenant_id = tenant.id
- users.is_active = true

// En cas d'échec
if (!tenant) throw UnauthorizedException("Tenant non identifié");
if (tenant.status === 'suspended') throw ForbiddenException("Compte suspendu");
if (tenant.status === 'deleted') throw NotFoundException("Tenant introuvable");
```

**Endpoints concernés :** tous les endpoints métier (menu, commandes, réservations, etc.)

---

## Règles d'affichage régional

Chaque région peut personnaliser l'affichage selon ses paramètres :

```ts
// Formatage montant selon région
function formatCurrency(amount: number, region: Region): string {
  return new Intl.NumberFormat(region.locale, {
    style: "currency",
    currency: region.currency_code,
    minimumFractionDigits: region.currency_code === "XOF" ? 0 : 2,
  }).format(amount);
}

// Exemples :
// XOF (Dakar) : "5 000 F CFA"
// MAD (Casablanca) : "50,00 DH"
// EUR (Paris) : "50,00 €"
```

---

## Variables d'environnement liées aux régions

```env
# Redis pour résolution tenant
REDIS_URL=redis://...

# Domaine racine plateforme
PLATFORM_DOMAIN=terangatable.com

# CDN pour assets (logos, images)
CDN_BASE_URL=https://cdn.terangatable.com
```
