-- Migration 001 : Schéma initial TérangaTable
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ── Fonction updated_at ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Fonction RLS : set_current_tenant ──────────────────────────────────────
CREATE OR REPLACE FUNCTION set_current_tenant(tenant_id UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.tenant_id', tenant_id::TEXT, TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── ENUMs ──────────────────────────────────────────────────────────────────
CREATE TYPE "TenantStatus" AS ENUM ('active', 'suspended', 'trial', 'deleted');
CREATE TYPE "OrderType" AS ENUM ('dine_in', 'takeaway', 'delivery', 'online');
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'card', 'mobile_money', 'online', 'voucher');
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE "ReservationStatus" AS ENUM ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show');
CREATE TYPE "ReservationSource" AS ENUM ('website', 'phone', 'walk_in', 'api');
CREATE TYPE "TableShape" AS ENUM ('round', 'square', 'rect');
CREATE TYPE "CustomerSegment" AS ENUM ('new', 'regular', 'vip', 'inactive');
CREATE TYPE "DeliveryStatus" AS ENUM ('pending', 'assigned', 'picked_up', 'en_route', 'delivered', 'failed');
CREATE TYPE "DeliveryZoneType" AS ENUM ('radius', 'polygon');
CREATE TYPE "OptionGroupType" AS ENUM ('single', 'multiple');
CREATE TYPE "SettingType" AS ENUM ('string', 'number', 'boolean', 'json', 'array');
CREATE TYPE "CustomFieldType" AS ENUM ('string', 'number', 'boolean', 'date', 'select', 'text');
CREATE TYPE "ConditionLogic" AS ENUM ('AND', 'OR');
CREATE TYPE "TenantRequestStatus" AS ENUM ('pending', 'approved', 'rejected');

-- ── DOMAINE SYSTÈME ────────────────────────────────────────────────────────

CREATE TABLE regions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100) NOT NULL,
  slug            VARCHAR(50)  NOT NULL UNIQUE,
  country_code    VARCHAR(2)   NOT NULL,
  country_name    VARCHAR(100) NOT NULL,
  platform_label  VARCHAR(150) NOT NULL,
  timezone        VARCHAR(50)  NOT NULL,
  currency_code   VARCHAR(3)   NOT NULL,
  currency_symbol VARCHAR(10)  NOT NULL,
  locale          VARCHAR(10)  NOT NULL,
  admin_id        UUID,
  is_active       BOOLEAN      DEFAULT TRUE,
  created_at      TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX idx_regions_country_code ON regions (country_code);
CREATE INDEX idx_regions_is_active    ON regions (is_active);

CREATE TABLE plans (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(100)   NOT NULL,
  price_monthly  DECIMAL(10,2)  NOT NULL,
  price_yearly   DECIMAL(10,2)  NOT NULL,
  max_users      INT            NOT NULL,
  max_products   INT            NOT NULL,
  features       JSONB          DEFAULT '{}',
  is_active      BOOLEAN        DEFAULT TRUE
);
CREATE INDEX idx_plans_is_active ON plans (is_active);

CREATE TABLE tenants (
  id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id     UUID           NOT NULL REFERENCES regions(id),
  slug          VARCHAR(63)    NOT NULL UNIQUE,
  name          VARCHAR(255)   NOT NULL,
  status        "TenantStatus" DEFAULT 'trial',
  plan_id       UUID           NOT NULL REFERENCES plans(id),
  settings      JSONB          DEFAULT '{}',
  trial_ends_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ    DEFAULT NOW(),
  updated_at    TIMESTAMPTZ    DEFAULT NOW()
);
CREATE INDEX idx_tenants_region_status ON tenants (region_id, status);
CREATE INDEX idx_tenants_status        ON tenants (status);
CREATE TRIGGER set_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE tenant_requests (
  id              UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id       UUID                  NOT NULL REFERENCES regions(id),
  owner_name      VARCHAR(255)          NOT NULL,
  owner_email     VARCHAR(255)          NOT NULL,
  restaurant_name VARCHAR(255)          NOT NULL,
  phone           VARCHAR(30),
  city            VARCHAR(100),
  message         TEXT,
  status          "TenantRequestStatus" DEFAULT 'pending',
  reviewed_by     UUID,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ           DEFAULT NOW()
);
CREATE INDEX idx_tenant_requests_status        ON tenant_requests (status);
CREATE INDEX idx_tenant_requests_region_status ON tenant_requests (region_id, status);
CREATE INDEX idx_tenant_requests_owner_email   ON tenant_requests (owner_email);

-- ── DOMAINE IDENTITÉ ───────────────────────────────────────────────────────

CREATE TABLE users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID        REFERENCES tenants(id) ON DELETE CASCADE,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  phone         VARCHAR(30),
  avatar_url    TEXT,
  is_active     BOOLEAN      DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX idx_users_tenant_active ON users (tenant_id, is_active);
CREATE INDEX idx_users_tenant        ON users (tenant_id);

-- FK circulaires ajoutées après
ALTER TABLE regions ADD CONSTRAINT fk_regions_admin
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE tenant_requests ADD CONSTRAINT fk_tenant_requests_reviewer
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE roles (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        REFERENCES tenants(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) NOT NULL,
  description TEXT,
  is_system   BOOLEAN      DEFAULT FALSE,
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (tenant_id, slug)
);
CREATE INDEX idx_roles_tenant_slug ON roles (tenant_id, slug);
CREATE INDEX idx_roles_is_system   ON roles (is_system);

CREATE TABLE permissions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  module      VARCHAR(50)  NOT NULL,
  action      VARCHAR(50)  NOT NULL,
  resource    VARCHAR(100) NOT NULL,
  description TEXT,
  UNIQUE (module, action, resource)
);
CREATE INDEX idx_permissions_module        ON permissions (module);
CREATE INDEX idx_permissions_module_action ON permissions (module, action);

CREATE TABLE user_roles (
  user_id    UUID        NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  role_id    UUID        NOT NULL REFERENCES roles(id)   ON DELETE CASCADE,
  tenant_id  UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID        REFERENCES users(id) ON DELETE SET NULL,
  PRIMARY KEY (user_id, role_id, tenant_id)
);
CREATE INDEX idx_user_roles_tenant_user ON user_roles (tenant_id, user_id);
CREATE INDEX idx_user_roles_role        ON user_roles (role_id);

CREATE TABLE role_permissions (
  role_id       UUID NOT NULL REFERENCES roles(id)       ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_permissions (
  user_id       UUID NOT NULL REFERENCES users(id)       ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL REFERENCES tenants(id)     ON DELETE CASCADE,
  PRIMARY KEY (user_id, permission_id, tenant_id)
);
CREATE INDEX idx_user_permissions_tenant_user ON user_permissions (tenant_id, user_id);

-- ── DOMAINE MENU ───────────────────────────────────────────────────────────

CREATE TABLE categories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  image_url   TEXT,
  sort_order  INT          DEFAULT 0,
  is_active   BOOLEAN      DEFAULT TRUE,
  parent_id   UUID         REFERENCES categories(id) ON DELETE SET NULL
);
CREATE INDEX idx_categories_tenant         ON categories (tenant_id, id);
CREATE INDEX idx_categories_tenant_active  ON categories (tenant_id, is_active, sort_order);
CREATE INDEX idx_categories_tenant_parent  ON categories (tenant_id, parent_id);

CREATE TABLE products (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id      UUID         REFERENCES categories(id) ON DELETE SET NULL,
  name             VARCHAR(255) NOT NULL,
  description      TEXT,
  base_price       DECIMAL(10,2) DEFAULT 0,
  sku              VARCHAR(100),
  image_url        TEXT,
  images           JSONB        DEFAULT '[]',
  tags             TEXT[]       DEFAULT '{}',
  allergens        TEXT[]       DEFAULT '{}',
  nutritional_info JSONB        DEFAULT '{}',
  is_available     BOOLEAN      DEFAULT TRUE,
  is_featured      BOOLEAN      DEFAULT FALSE,
  sort_order       INT          DEFAULT 0,
  created_at       TIMESTAMPTZ  DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_products_tenant_sku   ON products (tenant_id, sku) WHERE sku IS NOT NULL;
CREATE INDEX idx_products_tenant             ON products (tenant_id, id);
CREATE INDEX idx_products_tenant_cat         ON products (tenant_id, category_id, is_available);
CREATE INDEX idx_products_tenant_featured    ON products (tenant_id, is_featured);
CREATE INDEX idx_products_tenant_created     ON products (tenant_id, created_at);
CREATE INDEX idx_products_tags               ON products USING GIN (tags);

CREATE TABLE product_options_groups (
  id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID            NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id  UUID            NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name        VARCHAR(255)    NOT NULL,
  type        "OptionGroupType",
  is_required BOOLEAN         DEFAULT FALSE,
  min_select  INT             DEFAULT 0,
  max_select  INT             DEFAULT 1
);
CREATE INDEX idx_product_option_groups_tenant_product ON product_options_groups (tenant_id, product_id);

CREATE TABLE product_options (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     UUID         NOT NULL REFERENCES product_options_groups(id) ON DELETE CASCADE,
  tenant_id    UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name         VARCHAR(255) NOT NULL,
  price_delta  DECIMAL(10,2) DEFAULT 0,
  is_default   BOOLEAN      DEFAULT FALSE,
  is_available BOOLEAN      DEFAULT TRUE
);
CREATE INDEX idx_product_options_tenant_group ON product_options (tenant_id, group_id);

-- ── DOMAINE WORKFLOWS ─────────────────────────────────────────────────────

CREATE TABLE workflow_definitions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type VARCHAR(50)  NOT NULL,
  name        VARCHAR(255) NOT NULL,
  is_default  BOOLEAN      DEFAULT FALSE
);
CREATE INDEX idx_workflow_defs_tenant_entity ON workflow_definitions (tenant_id, entity_type);

CREATE TABLE workflow_states (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id    UUID        NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  tenant_id      UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name           VARCHAR(100) NOT NULL,
  slug           VARCHAR(100) NOT NULL,
  color          VARCHAR(7)   NOT NULL,
  is_initial     BOOLEAN      DEFAULT FALSE,
  is_terminal    BOOLEAN      DEFAULT FALSE,
  triggers_alert BOOLEAN      DEFAULT FALSE,
  sort_order     INT          DEFAULT 0
);
CREATE INDEX idx_workflow_states_tenant_wf ON workflow_states (tenant_id, workflow_id, sort_order);

CREATE TABLE workflow_transitions (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id   UUID         NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  from_state_id UUID         REFERENCES workflow_states(id) ON DELETE CASCADE,
  to_state_id   UUID         NOT NULL REFERENCES workflow_states(id) ON DELETE CASCADE,
  name          VARCHAR(100) NOT NULL,
  allowed_roles TEXT[]       DEFAULT '{}',
  conditions    JSONB        DEFAULT '{}'
);
CREATE INDEX idx_workflow_transitions_from ON workflow_transitions (workflow_id, from_state_id);
CREATE INDEX idx_workflow_transitions_to   ON workflow_transitions (workflow_id, to_state_id);

-- ── DOMAINE COMMANDES ─────────────────────────────────────────────────────

CREATE TABLE customers (
  id             UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID             NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  first_name     VARCHAR(100)     NOT NULL,
  last_name      VARCHAR(100)     NOT NULL,
  email          VARCHAR(255),
  phone          VARCHAR(30),
  total_orders   INT              DEFAULT 0,
  total_spent    DECIMAL(12,2)    DEFAULT 0,
  loyalty_points INT              DEFAULT 0,
  last_visit_at  TIMESTAMPTZ,
  segment        "CustomerSegment" DEFAULT 'new',
  notes          TEXT,
  created_at     TIMESTAMPTZ      DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_customers_tenant_email ON customers (tenant_id, email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX idx_customers_tenant_phone ON customers (tenant_id, phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_customers_tenant           ON customers (tenant_id, id);
CREATE INDEX idx_customers_tenant_created   ON customers (tenant_id, created_at);
CREATE INDEX idx_customers_tenant_segment   ON customers (tenant_id, segment);
CREATE INDEX idx_customers_tenant_visit     ON customers (tenant_id, last_visit_at);

CREATE TABLE zones (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name      VARCHAR(100) NOT NULL,
  is_active BOOLEAN      DEFAULT TRUE
);
CREATE INDEX idx_zones_tenant ON zones (tenant_id, id);

CREATE TABLE tables (
  id        UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  zone_id   UUID         REFERENCES zones(id) ON DELETE SET NULL,
  number    VARCHAR(20)  NOT NULL,
  capacity  INT          DEFAULT 4,
  shape     "TableShape",
  pos_x     INT          DEFAULT 0,
  pos_y     INT          DEFAULT 0,
  is_active BOOLEAN      DEFAULT TRUE,
  UNIQUE (tenant_id, number)
);
CREATE INDEX idx_tables_tenant           ON tables (tenant_id, id);
CREATE INDEX idx_tables_tenant_zone      ON tables (tenant_id, zone_id, is_active);
CREATE INDEX idx_tables_tenant_active    ON tables (tenant_id, is_active);

CREATE TABLE orders (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_number     VARCHAR(50) NOT NULL,
  type             "OrderType",
  status           VARCHAR(50) NOT NULL DEFAULT 'pending',
  workflow_state_id UUID       REFERENCES workflow_states(id) ON DELETE SET NULL,
  table_id         UUID        REFERENCES tables(id) ON DELETE SET NULL,
  customer_id      UUID        REFERENCES customers(id) ON DELETE SET NULL,
  agent_id         UUID        REFERENCES users(id) ON DELETE SET NULL,
  subtotal         DECIMAL(10,2) DEFAULT 0,
  tax_amount       DECIMAL(10,2) DEFAULT 0,
  discount_amount  DECIMAL(10,2) DEFAULT 0,
  total            DECIMAL(10,2) DEFAULT 0,
  notes            TEXT,
  delivery_address JSONB,
  paid_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (tenant_id, order_number)
);
CREATE INDEX idx_orders_tenant           ON orders (tenant_id, id);
CREATE INDEX idx_orders_tenant_created   ON orders (tenant_id, created_at);
CREATE INDEX idx_orders_tenant_status    ON orders (tenant_id, status);
CREATE INDEX idx_orders_tenant_type      ON orders (tenant_id, type, created_at);
CREATE INDEX idx_orders_tenant_workflow  ON orders (tenant_id, workflow_state_id);

CREATE TABLE order_items (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID         NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  tenant_id    UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id   UUID         REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  unit_price   DECIMAL(10,2) NOT NULL,
  quantity     INT          NOT NULL DEFAULT 1,
  options      JSONB        DEFAULT '[]',
  notes        TEXT,
  line_total   DECIMAL(10,2) NOT NULL,
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX idx_order_items_tenant_order   ON order_items (tenant_id, order_id);
CREATE INDEX idx_order_items_tenant_product ON order_items (tenant_id, product_id, created_at);

CREATE TABLE payments (
  id        UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id  UUID           NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  tenant_id UUID           NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  method    "PaymentMethod",
  amount    DECIMAL(10,2)  NOT NULL,
  reference VARCHAR(255),
  status    "PaymentStatus",
  metadata  JSONB          DEFAULT '{}',
  created_at TIMESTAMPTZ   DEFAULT NOW()
);
CREATE INDEX idx_payments_tenant_order   ON payments (tenant_id, order_id);
CREATE INDEX idx_payments_tenant_created ON payments (tenant_id, created_at);
CREATE INDEX idx_payments_tenant_status  ON payments (tenant_id, status);
CREATE INDEX idx_payments_tenant_method  ON payments (tenant_id, method, created_at);

-- ── DOMAINE RÉSERVATIONS ──────────────────────────────────────────────────

CREATE TABLE reservations (
  id             UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID               NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id    UUID               REFERENCES customers(id) ON DELETE SET NULL,
  customer_name  VARCHAR(255)       NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(30),
  party_size     INT                DEFAULT 1,
  table_id       UUID               REFERENCES tables(id) ON DELETE SET NULL,
  reserved_at    TIMESTAMPTZ        NOT NULL,
  duration_min   INT                DEFAULT 90,
  status         "ReservationStatus",
  source         "ReservationSource",
  notes          TEXT,
  reminder_sent  BOOLEAN            DEFAULT FALSE,
  created_at     TIMESTAMPTZ        DEFAULT NOW()
);
CREATE INDEX idx_reservations_tenant          ON reservations (tenant_id, id);
CREATE INDEX idx_reservations_tenant_date     ON reservations (tenant_id, reserved_at);
CREATE INDEX idx_reservations_tenant_status   ON reservations (tenant_id, status);
CREATE INDEX idx_reservations_tenant_table    ON reservations (tenant_id, table_id, reserved_at);

-- ── DOMAINE CONFIGURATION ─────────────────────────────────────────────────

CREATE TABLE settings (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key        VARCHAR(255) NOT NULL,
  value      JSONB        NOT NULL,
  type       "SettingType",
  category   VARCHAR(100),
  updated_at TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (tenant_id, key)
);
CREATE INDEX idx_settings_tenant_key      ON settings (tenant_id, key);
CREATE INDEX idx_settings_tenant_category ON settings (tenant_id, category);

CREATE TABLE custom_fields (
  id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID            NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type         VARCHAR(50)     NOT NULL,
  name                VARCHAR(100)    NOT NULL,
  label               VARCHAR(255)    NOT NULL,
  field_type          "CustomFieldType",
  options             JSONB,
  is_required         BOOLEAN         DEFAULT FALSE,
  is_shown_on_vitrine BOOLEAN         DEFAULT FALSE,
  sort_order          INT             DEFAULT 0
);
CREATE INDEX idx_custom_fields_tenant_entity ON custom_fields (tenant_id, entity_type, sort_order);
CREATE INDEX idx_custom_fields_tenant        ON custom_fields (tenant_id, id);

CREATE TABLE custom_field_values (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  custom_field_id UUID         NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  entity_id       UUID         NOT NULL,
  entity_type     VARCHAR(50)  NOT NULL,
  value_string    TEXT,
  value_number    DECIMAL(15,4),
  value_boolean   BOOLEAN,
  value_date      DATE,
  UNIQUE (custom_field_id, entity_id)
);
CREATE INDEX idx_cfv_tenant_entity    ON custom_field_values (tenant_id, entity_type, entity_id);
CREATE INDEX idx_cfv_tenant_field     ON custom_field_values (tenant_id, custom_field_id);

-- ── DOMAINE SITE VITRINE ──────────────────────────────────────────────────

CREATE TABLE themes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) NOT NULL UNIQUE,
  preview_url TEXT,
  config      JSONB        DEFAULT '{}',
  is_premium  BOOLEAN      DEFAULT FALSE,
  is_active   BOOLEAN      DEFAULT TRUE
);
CREATE INDEX idx_themes_slug        ON themes (slug);
CREATE INDEX idx_themes_active      ON themes (is_active, is_premium);

CREATE TABLE website_settings (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID        NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  theme_id         UUID        REFERENCES themes(id) ON DELETE SET NULL,
  custom_domain    VARCHAR(255),
  is_published     BOOLEAN     DEFAULT FALSE,
  primary_color    VARCHAR(7)  DEFAULT '#C8553D',
  secondary_color  VARCHAR(7)  DEFAULT '#D4A843',
  logo_url         TEXT,
  favicon_url      TEXT,
  hero_image_url   TEXT,
  seo_title        VARCHAR(255),
  seo_description  TEXT,
  seo_keywords     TEXT,
  google_analytics VARCHAR(50),
  sections_config  JSONB       DEFAULT '{}',
  social_links     JSONB       DEFAULT '{}',
  font_heading     VARCHAR(100) DEFAULT 'Plus Jakarta Sans',
  font_body        VARCHAR(100) DEFAULT 'DM Sans'
);
CREATE INDEX idx_website_settings_domain ON website_settings (custom_domain)
  WHERE custom_domain IS NOT NULL;

CREATE TABLE pages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL,
  slug            VARCHAR(255) NOT NULL,
  content         JSONB        DEFAULT '{}',
  is_published    BOOLEAN      DEFAULT FALSE,
  seo_title       VARCHAR(255),
  seo_description TEXT,
  sort_order      INT          DEFAULT 0,
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (tenant_id, slug)
);
CREATE INDEX idx_pages_tenant_slug      ON pages (tenant_id, slug);
CREATE INDEX idx_pages_tenant_published ON pages (tenant_id, is_published, sort_order);

-- ── DOMAINE MODULES ───────────────────────────────────────────────────────

CREATE TABLE modules (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  slug          VARCHAR(50)  NOT NULL UNIQUE,
  description   TEXT,
  icon          VARCHAR(50),
  version       VARCHAR(20)  DEFAULT '1.0.0',
  is_active     BOOLEAN      DEFAULT TRUE,
  required_plan VARCHAR(50)  NOT NULL
);
CREATE INDEX idx_modules_slug      ON modules (slug);
CREATE INDEX idx_modules_is_active ON modules (is_active);

CREATE TABLE tenant_modules (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  module_id    UUID        NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  is_active    BOOLEAN     DEFAULT TRUE,
  config       JSONB       DEFAULT '{}',
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at   TIMESTAMPTZ,
  UNIQUE (tenant_id, module_id)
);
CREATE INDEX idx_tenant_modules_active ON tenant_modules (tenant_id, is_active);
CREATE INDEX idx_tenant_modules        ON tenant_modules (tenant_id, module_id);

-- ── DOMAINE RÈGLES ────────────────────────────────────────────────────────

CREATE TABLE rules (
  id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID           NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            VARCHAR(255)   NOT NULL,
  event_trigger   VARCHAR(100)   NOT NULL,
  conditions      JSONB          DEFAULT '[]',
  condition_logic "ConditionLogic" DEFAULT 'AND',
  actions         JSONB          DEFAULT '[]',
  is_active       BOOLEAN        DEFAULT TRUE,
  priority        INT            DEFAULT 0,
  created_at      TIMESTAMPTZ    DEFAULT NOW()
);
CREATE INDEX idx_rules_tenant_event   ON rules (tenant_id, event_trigger, is_active);
CREATE INDEX idx_rules_tenant         ON rules (tenant_id, id);
CREATE INDEX idx_rules_tenant_created ON rules (tenant_id, created_at);

-- ── DOMAINE LIVRAISON ─────────────────────────────────────────────────────

CREATE TABLE delivery_zones (
  id           UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID             NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name         VARCHAR(100)     NOT NULL,
  type         "DeliveryZoneType",
  radius_km    DECIMAL(8,2),
  polygon      JSONB,
  min_order    DECIMAL(10,2)    DEFAULT 0,
  delivery_fee DECIMAL(10,2)    DEFAULT 0,
  is_active    BOOLEAN          DEFAULT TRUE
);
CREATE INDEX idx_delivery_zones_tenant ON delivery_zones (tenant_id, id);

CREATE TABLE delivery_agents (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         VARCHAR(255) NOT NULL,
  phone        VARCHAR(30),
  is_available BOOLEAN     DEFAULT FALSE,
  zone_id      UUID        REFERENCES delivery_zones(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_delivery_agents_tenant     ON delivery_agents (tenant_id, id);
CREATE INDEX idx_delivery_agents_available  ON delivery_agents (tenant_id, is_available);
CREATE INDEX idx_delivery_agents_user       ON delivery_agents (tenant_id, user_id);

CREATE TABLE deliveries (
  id           UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID           NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  tenant_id    UUID           NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_id     UUID           REFERENCES delivery_agents(id) ON DELETE SET NULL,
  status       "DeliveryStatus",
  assigned_at  TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  notes        TEXT
);
CREATE INDEX idx_deliveries_tenant        ON deliveries (tenant_id, id);
CREATE INDEX idx_deliveries_tenant_status ON deliveries (tenant_id, status);
CREATE INDEX idx_deliveries_tenant_agent  ON deliveries (tenant_id, agent_id, status);
CREATE INDEX idx_deliveries_order         ON deliveries (order_id);

-- ── RLS ───────────────────────────────────────────────────────────────────

-- RLS for the tenants table itself (PK = id, not tenant_id)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tenants
  USING (
    (current_setting('app.role', TRUE) = 'super_admin')
    OR
    (id = NULLIF(current_setting('app.tenant_id', TRUE), '')::uuid)
  );

-- RLS for all other tables that have a tenant_id FK column
DO $$
DECLARE
  t TEXT;
  tenant_tables TEXT[] := ARRAY[
    'users','roles','user_roles','user_permissions',
    'categories','products','product_options_groups','product_options',
    'orders','order_items','payments',
    'reservations','zones','tables',
    'settings','custom_fields','custom_field_values',
    'workflow_definitions','workflow_states',
    'website_settings','pages',
    'tenant_modules','rules','customers',
    'delivery_zones','delivery_agents','deliveries'
  ];
BEGIN
  FOREACH t IN ARRAY tenant_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I
       USING (
         (current_setting(''app.role'', TRUE) = ''super_admin'')
         OR
         (tenant_id = NULLIF(current_setting(''app.tenant_id'', TRUE), '''')::uuid)
       )',
      t
    );
  END LOOP;
END;
$$;
