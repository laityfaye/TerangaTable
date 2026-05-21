-- Migration RLS : Isolation multi-tenant via app.current_tenant
-- Remplace les anciennes policies app.tenant_id par app.current_tenant
-- Crée le rôle terangatable_app pour l'application

-- ── Rôle applicatif ────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'terangatable_app') THEN
    CREATE ROLE terangatable_app LOGIN;
  END IF;
END;
$$;

-- ── Politique RLS sur la table tenants (PK = id, pas de tenant_id) ─────────
DROP POLICY IF EXISTS tenant_isolation ON tenants;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tenants
  USING (
    (current_setting('app.role', true) = 'super_admin')
    OR
    (id = NULLIF(current_setting('app.current_tenant', true), '')::uuid)
  )
  WITH CHECK (
    (current_setting('app.role', true) = 'super_admin')
    OR
    (id = NULLIF(current_setting('app.current_tenant', true), '')::uuid)
  );
ALTER TABLE tenants NO FORCE ROW LEVEL SECURITY;
GRANT ALL ON tenants TO terangatable_app;

-- ── Politique RLS sur toutes les tables métier (tenant_id FK) ─────────────
DO $$
DECLARE
  t TEXT;
  tenant_tables TEXT[] := ARRAY[
    'categories',
    'products',
    'product_options_groups',
    'product_options',
    'orders',
    'order_items',
    'payments',
    'reservations',
    'tables',
    'zones',
    'customers',
    'settings',
    'custom_fields',
    'custom_field_values',
    'workflow_definitions',
    'workflow_states',
    'workflow_transitions',
    'website_settings',
    'pages',
    'rules',
    'delivery_zones',
    'delivery_agents',
    'deliveries'
  ];
BEGIN
  FOREACH t IN ARRAY tenant_tables LOOP
    -- Supprimer les anciennes policies
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);

    -- Activer RLS
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);

    -- Créer la nouvelle policy avec app.current_tenant
    EXECUTE format(
      $policy$
      CREATE POLICY tenant_isolation ON %I
        USING (
          (current_setting('app.role', true) = 'super_admin')
          OR
          (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid)
        )
        WITH CHECK (
          (current_setting('app.role', true) = 'super_admin')
          OR
          (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid)
        )
      $policy$,
      t
    );

    -- Bypass pour le propriétaire du schéma (migrations, seeds)
    EXECUTE format('ALTER TABLE %I NO FORCE ROW LEVEL SECURITY', t);

    -- Accès complet au rôle applicatif (qui doit suivre la policy)
    EXECUTE format('GRANT ALL ON %I TO terangatable_app', t);
  END LOOP;
END;
$$;

-- Accès aux tables système (lecture) pour le rôle app
GRANT SELECT ON regions, plans, modules, themes TO terangatable_app;
GRANT ALL ON tenant_requests, tenant_modules, roles, permissions,
             user_roles, role_permissions, user_permissions TO terangatable_app;
