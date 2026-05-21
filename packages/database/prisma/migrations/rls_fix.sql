-- RLS fix: apply policies to all tenant-scoped tables

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
